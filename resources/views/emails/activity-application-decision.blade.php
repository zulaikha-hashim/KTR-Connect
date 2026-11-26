@php
    $appName = config('app.name');
    $approved = $application->status === 'approved';
    $decision = $approved ? 'approved' : 'rejected';
    $statusColor = $approved ? '#047857' : '#b91c1c';
    $statusBackground = $approved ? '#d1fae5' : '#fee2e2';
    $hasApplicantAccount = (bool) $application->felo?->email;
    $portalUrl = $hasApplicantAccount ? route('staff') : route('admin');
    $portalButton = $hasApplicantAccount ? 'View my applications' : 'View applications';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Activity application {{ $decision }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        An activity application has been {{ $decision }}.
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
                                    <td style="height:4px;background-color:{{ $statusColor }};font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                            </table>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:32px 32px 8px;">
                                        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:{{ $statusBackground }};color:{{ $statusColor }};font-size:12px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">
                                            {{ $decision }}
                                        </span>
                                        <h1 style="margin:16px 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
                                            Activity application {{ $decision }}
                                        </h1>
                                        <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
                                            The application for <strong>{{ $application->activity_name ?: 'your activity' }}</strong>
                                            has been {{ $decision }}.
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
                                                            <td style="padding:12px 0;color:#6b7280;">Activity</td>
                                                            <td style="padding:12px 0;color:#111827;font-weight:600;">{{ $application->activity_name ?: 'Untitled activity' }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @if ($application->status === 'rejected' && $application->review_notes)
                                    <tr>
                                        <td style="padding:16px 32px 8px;">
                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                                                <tr>
                                                    <td style="padding:16px 20px;">
                                                        <p style="margin:0 0 8px;color:#991b1b;font-size:14px;font-weight:700;">Review notes</p>
                                                        <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.6;">{{ $application->review_notes }}</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                @endif
                                <tr>
                                    <td align="center" style="padding:24px 32px 8px;">
                                        <a href="{{ $portalUrl }}" target="_blank" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                                            {{ $portalButton }}
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 32px 32px;">
                                        <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
                                            Button not working? Copy and paste this link into your browser:<br>
                                            <a href="{{ $portalUrl }}" style="color:#4f46e5;word-break:break-all;">{{ $portalUrl }}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:24px 16px 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                            This is an automated activity application update from {{ $appName }}.<br>
                            &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
