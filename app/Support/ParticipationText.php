<?php

namespace App\Support;

class ParticipationText
{
    public static function normalize(string $text, bool $activity = false): string
    {
        $text = preg_replace('/\s+/u', ' ', trim($text));
        $text = function_exists('mb_convert_case')
            ? mb_convert_case($text, MB_CASE_TITLE, 'UTF-8')
            : ucwords(strtolower($text));

        // Preserve common abbreviations in Malaysian names and KTR activities.
        $text = preg_replace_callback(
            '/(?<![\pL\pN])(?:A\/[PL]|KTR|UTM|AJK|HOD|MT)(?![\pL\pN])/iu',
            fn ($match) => strtoupper($match[0]),
            $text
        );
        return $text;
    }
}
