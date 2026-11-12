<h1>New activity application submitted</h1>

<p>{{ $application->activity_name }} is awaiting admin approval.</p>
<p>Felo ID: {{ $application->felo_id ?? 'Not available' }}</p>
<p>Venue: {{ $application->venue }}</p>
<p>Start: {{ $application->start_at?->format('d M Y, h:i A') }}</p>

<p><a href="{{ route('admin') }}">Open the admin review queue</a></p>