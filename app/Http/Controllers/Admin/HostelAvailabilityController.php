<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HostelAuditLog;
use App\Models\HostelBed;
use App\Models\HostelReservation;
use App\Models\HostelRestriction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HostelAvailabilityController extends Controller
{
    public function store(
        Request $request,
        HostelBed $bed
    ): RedirectResponse {
        $actor = $this->localPreviewActor($request);

        // Remove surrounding spaces before validating the reason.
        $request->merge([
            'reason' => is_string($request->input('reason'))
                ? trim($request->input('reason'))
                : $request->input('reason'),
        ]);

        $validated = $request->validate([
            'session' => [
                'required',
                'integer',
                'exists:hostel_academic_sessions,id',
            ],
            'type' => [
                'required',
                Rule::in([
                    'maintenance',
                    'administrative_block',
                ]),
            ],
            'reason' => [
                'required',
                'string',
                'min:3',
                'max:1000',
            ],
        ]);

        $sessionId = (int) $validated['session'];
        $type = $validated['type'];

        DB::transaction(function () use (
            $bed,
            $actor,
            $validated,
            $sessionId,
            $type
        ) {
            // Other availability actions must wait for this bed.
            $lockedBed = HostelBed::query()
                ->whereKey($bed->id)
                ->lockForUpdate()
                ->firstOrFail();

            $now = now()->utc();

            // Find confirmed allocations and unexpired holds.
            $bookingQuery = HostelReservation::query()
                ->where('hostel_bed_id', $lockedBed->id)
                ->where(function ($query) use ($now) {
                    $query
                        ->where('status', 'confirmed')
                        ->orWhere(function ($query) use ($now) {
                            $query
                                ->where('status', 'held')
                                ->where('hold_expires_at', '>', $now);
                        });
                });

            // Maintenance affects all sessions.
            // Administrative blocks affect the selected session.
            if ($type === 'administrative_block') {
                $bookingQuery->where(
                    'hostel_academic_session_id',
                    $sessionId
                );
            }

            if ($bookingQuery->exists()) {
                throw ValidationException::withMessages([
                    'availability' =>
                        'This bed has a confirmed allocation or an active hold '
                        . 'within the affected scope. Resolve the booking first.',
                ]);
            }

            // Check for overlapping restrictions that have not ended.
            $restrictionQuery = HostelRestriction::query()
                ->where('hostel_bed_id', $lockedBed->id)
                ->whereNull('ended_at');

            if ($type === 'administrative_block') {
                $restrictionQuery->where(
                    function ($query) use ($sessionId) {
                        $query
                            ->whereNull('hostel_academic_session_id')
                            ->orWhere(
                                'hostel_academic_session_id',
                                $sessionId
                            );
                    }
                );
            }

            if ($restrictionQuery->exists()) {
                throw ValidationException::withMessages([
                    'availability' =>
                        'An overlapping restriction already exists. '
                        . 'Restore that restriction before adding another.',
                ]);
            }

            $restrictionSessionId = $type === 'maintenance'
                ? null
                : $sessionId;

            // Create the restriction.
            $restriction = HostelRestriction::create([
                'reference' => 'HRS-' . Str::uuid()->toString(),
                'hostel_bed_id' => $lockedBed->id,
                'hostel_academic_session_id' => $restrictionSessionId,
                'type' => $type,
                'reason' => $validated['reason'],
                'starts_at' => $now,
                'created_by' => $actor->id,
            ]);

            // Save the audit record in the same transaction.
            HostelAuditLog::create([
                'hostel_restriction_id' => $restriction->id,
                'hostel_bed_id' => $lockedBed->id,
                'hostel_academic_session_id' => $restrictionSessionId,
                'actor_id' => $actor->id,
                'action' => 'restricted',
                'previous_state' => 'available',
                'new_state' => 'unavailable',
                'reason' => $validated['reason'],
                'occurred_at' => $now,
            ]);
        });

        return redirect()->route('admin.hostel.rooms.index', [
            'session' => $sessionId,
        ]);
    }

    public function restore(
        Request $request,
        HostelBed $bed,
        HostelRestriction $restriction
    ): RedirectResponse {
        $actor = $this->localPreviewActor($request);

        $request->merge([
            'reason' => is_string($request->input('reason'))
                ? trim($request->input('reason'))
                : $request->input('reason'),
        ]);

        $validated = $request->validate([
            'session' => [
                'required',
                'integer',
                'exists:hostel_academic_sessions,id',
            ],
            'reason' => [
                'required',
                'string',
                'min:3',
                'max:1000',
            ],
        ]);

        $sessionId = (int) $validated['session'];

        DB::transaction(function () use (
            $bed,
            $restriction,
            $actor,
            $validated,
            $sessionId
        ) {
            // Use the same bed lock as the restriction action.
            $lockedBed = HostelBed::query()
                ->whereKey($bed->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Confirm the restriction belongs to this bed.
            $lockedRestriction = HostelRestriction::query()
                ->whereKey($restriction->id)
                ->where('hostel_bed_id', $lockedBed->id)
                ->lockForUpdate()
                ->firstOrFail();

            // A session-specific restriction must match the selected session.
            if (
                $lockedRestriction->hostel_academic_session_id !== null
                && (int) $lockedRestriction->hostel_academic_session_id !== $sessionId
            ) {
                throw ValidationException::withMessages([
                    'availability' =>
                        'This restriction belongs to another academic session.',
                ]);
            }

            if ($lockedRestriction->ended_at !== null) {
                throw ValidationException::withMessages([
                    'availability' =>
                        'This restriction has already been restored. Refresh the page.',
                ]);
            }

            $now = now()->utc();

            // End the restriction without deleting its original details.
            $lockedRestriction->update([
                'ended_at' => $now,
                'ended_by' => $actor->id,
                'end_reason' => $validated['reason'],
            ]);

            // Another restriction may still affect this bed.
            $hasRemainingRestriction = HostelRestriction::query()
                ->where('hostel_bed_id', $lockedBed->id)
                ->whereNull('ended_at')
                ->where('starts_at', '<=', $now)
                ->where(function ($query) use ($sessionId) {
                    $query
                        ->whereNull('hostel_academic_session_id')
                        ->orWhere(
                            'hostel_academic_session_id',
                            $sessionId
                        );
                })
                ->exists();

            // Ending a restriction must not erase an existing booking.
            $hasActiveBooking = HostelReservation::query()
                ->where('hostel_bed_id', $lockedBed->id)
                ->where('hostel_academic_session_id', $sessionId)
                ->where(function ($query) use ($now) {
                    $query
                        ->where('status', 'confirmed')
                        ->orWhere(function ($query) use ($now) {
                            $query
                                ->where('status', 'held')
                                ->where('hold_expires_at', '>', $now);
                        });
                })
                ->exists();

            // This audit availability is evaluated for the selected session.
            $newState = $hasRemainingRestriction || $hasActiveBooking
                ? 'unavailable'
                : 'available';

            HostelAuditLog::create([
                'hostel_restriction_id' => $lockedRestriction->id,
                'hostel_bed_id' => $lockedBed->id,
                'hostel_academic_session_id' => $sessionId,
                'actor_id' => $actor->id,
                'action' => 'restored',
                'previous_state' => 'unavailable',
                'new_state' => $newState,
                'reason' => $validated['reason'],
                'occurred_at' => $now,
            ]);
        });

        return redirect()->route('admin.hostel.rooms.index', [
            'session' => $sessionId,
        ]);
    }

    private function localPreviewActor(Request $request): User
    {
        // Temporary local preview only.
        // Replace this with real authentication and authorisation later.
        abort_unless(
            app()->environment('local')
            && in_array(
                $request->server('REMOTE_ADDR'),
                ['127.0.0.1', '::1'],
                true
            )
            && in_array(
                $request->getHost(),
                ['127.0.0.1', 'localhost', '::1', '[::1]'],
                true
            ),
            403,
            'Availability editing is only enabled for the local preview.'
        );

        $actor = User::query()
            ->where('email', 'hostel-demo-admin@example.invalid')
            ->first();

        abort_unless(
            $actor !== null,
            403,
            'The demo hostel administrator record is missing.'
        );

        return $actor;
    }
}