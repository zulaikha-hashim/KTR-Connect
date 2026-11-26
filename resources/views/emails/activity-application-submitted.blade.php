@php
    $appName = config('app.name');
    $submittedBy = $application->felo?->name;
    $submittedAt = $application->created_at?->format('M j, Y \a\t g:i A');
    $reviewUrl = route('admin');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Activity application awaiting approval</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        A new activity application is waiting for your review.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
                    <tr>
                        <td align="center" style="padding-bottom:20px;font-size:18px;font-weight:700;letter-spacing:0.3px;color:#111827;">
                            {{ $appName }}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="height:4px;background-color:#4f46e5;font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:32px 32px 8px;">
                                        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:#fef3c7;color:#92400e;font-size:12px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">
                                            Pending approval
                                        </span>
                                        <h1 style="margin:16px 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
                                            New activity application
                                        </h1>
                                        <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
                                            An application has been submitted and needs your review.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:24px 32px 8px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                                            <tr>
                                                <td style="padding:6px 20px;">
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
                                                        <tr>
                                                            <td style="padding:12px 0;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">Application ID</td>
                                                            <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">#{{ $application->id }}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Activity</td>
                                                            <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">{{ $application->activity_name ?: 'Untitled draft' }}</td>
                                                        </tr>
                                                        @if ($submittedBy)
                                                            <tr>
                                                                <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Submitted by</td>
                                                                <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">{{ $submittedBy }}</td>
                                                            </tr>
                                                        @endif
                                                        @if ($application->director_name)
                                                            <tr>
                                                                <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Activity director</td>
                                                                <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">{{ $application->director_name }}</td>
                                                            </tr>
                                                        @endif
                                                        @if ($application->venue)
                                                            <tr>
                                                                <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Venue</td>
                                                                <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">{{ $application->venue }}</td>
                                                            </tr>
                                                        @endif
                                                        @if ($application->start_at)
                                                            <tr>
                                                                <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Starts</td>
                                                                <td style="padding:12px 0;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">{{ $application->start_at->format('M j, Y \a\t g:i A') }}</td>
                                                            </tr>
                                                        @endif
                                                        @if ($submittedAt)
                                                            <tr>
                                                                <td style="padding:12px 0;color:#6b7280;">Submitted on</td>
                                                                <td style="padding:12px 0;color:#111827;font-weight:600;">{{ $submittedAt }}</td>
                                                            </tr>
                                                        @endif
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:24px 32px 8px;">
                                        <a href="{{ $reviewUrl }}" target="_blank" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                                            Review application
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 32px 32px;">
                                        <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
                                            Button not working? Copy and paste this link into your browser:<br>
                                            <a href="{{ $reviewUrl }}" style="color:#4f46e5;word-break:break-all;">{{ $reviewUrl }}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:24px 16px 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                            You're receiving this because you're an administrator on {{ $appName }}.<br>
                            &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>