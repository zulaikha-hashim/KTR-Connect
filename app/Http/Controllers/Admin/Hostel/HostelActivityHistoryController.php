<?php

namespace App\Http\Controllers\Admin\Hostel;

use App\Http\Controllers\Controller;
use App\Models\HostelAcademicSession;
use App\Models\HostelAuditLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HostelActivityHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        // Local preview until authentication and roles are connected.
        abort_unless(
            app()->environment('local')
            && in_array(
                $request->server('REMOTE_ADDR'),
                ['127.0.0.1', '::1'],
                true
            ),
            403,
            'Activity history is only enabled for the local preview.'
        );

        $validated = $request->validate([
            'session' => [
                'nullable',
                'integer',
                'exists:hostel_academic_sessions,id',
            ],
            'action' => [
                'nullable',
                Rule::in(['restricted', 'restored']),
            ],
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $sessionId = isset($validated['session'])
            ? (int) $validated['session']
            : null;

        $action = $validated['action'] ?? '';
        $search = trim($validated['search'] ?? '');

        $academicSessions = HostelAcademicSession::query()
            ->orderByDesc('academic_year')
            ->orderByDesc('semester')
            ->get(['id', 'name']);

        $query = HostelAuditLog::query()
            ->with([
                'actor:id,name',
                'bed.room.block',
                'restriction.academicSession',
                'academicSession:id,name',
            ]);

        if ($sessionId !== null) {
            // Filter by the restriction's scope.
            // Global maintenance remains relevant to every session,
            // including its restoration events.
            $query->whereHas(
                'restriction',
                function ($query) use ($sessionId) {
                    $query->where(function ($query) use ($sessionId) {
                        $query
                            ->whereNull('hostel_academic_session_id')
                            ->orWhere(
                                'hostel_academic_session_id',
                                $sessionId
                            );
                    });
                }
            );
        }

        if ($action !== '') {
            $query->where('action', $action);
        }

        if ($search !== '') {
            $query->whereHas('bed.room', function ($query) use ($search) {
                $query->where(
                    'room_number',
                    'like',
                    '%' . $search . '%'
                );
            });
        }

        $logs = $query
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function (HostelAuditLog $log) {
                return [
                    'id' => $log->id,
                    'occurred_at' => $log->occurred_at
                        ->copy()
                        ->utc()
                        ->toIso8601String(),
                    'actor_name' => $log->actor?->name ?? 'Unknown',
                    'room_number' => $log->bed?->room?->room_number
                        ?? 'Unknown room',
                    'block_name' => $log->bed?->room?->block?->name
                        ?? 'Unknown block',
                    'bed_label' => $log->bed?->label ?? '—',
                    'action' => $log->action,
                    'previous_state' => $log->previous_state,
                    'new_state' => $log->new_state,
                    'reason' => $log->reason,
                    'restriction_reference' => $log->restriction?->reference,
                    'restriction_type' => $log->restriction?->type,
                    'scope' => $log->restriction?->hostel_academic_session_id
                        === null
                            ? 'All academic sessions'
                            : $log->restriction?->academicSession?->name,
                    'event_session' => $log->academicSession?->name
                        ?? 'Global scope',
                ];
            });

        return Inertia::render('Hostel/AdminActivityHistory', [
            'logs' => $logs,
            'academicSessions' => $academicSessions,
            'filters' => [
                'session' => $sessionId === null
                    ? ''
                    : (string) $sessionId,
                'action' => $action,
                'search' => $search,
            ],
        ]);
    }
}