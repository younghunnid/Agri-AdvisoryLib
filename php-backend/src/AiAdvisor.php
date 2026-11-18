<?php
declare(strict_types=1);

namespace AgriAdvisory;

final class AiAdvisor
{
    public static function ask(string $question, ?string $cropSlug = null): array
    {
        $apiKey = trim((string)(getenv('GEMINI_API_KEY') ?: ''));
        $clean = substr(preg_replace('/[\x00-\x1F\x7F]/', ' ', trim($question)) ?: '', 0, 1200);

        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'providerMode' => 'unavailable_demo',
                'modelUsed' => null,
                'disclaimer' => 'Live AI advisor is not configured on this PHP server (GEMINI_API_KEY missing). Showing static guide recommendations instead.',
                'summary' => 'Live AI generation is unavailable. Browse approved demonstration guides or consult an agricultural expert.',
                'possibleCauses' => ['Nutrient balance, water drainage, or pest/disease pressure require field checks.'],
                'clarifyingQuestions' => ['How many plants show symptoms?', 'Are the symptoms on old or new leaves?'],
                'practicalLowRiskSteps' => ['Inspect leaf undersides early in the morning.', 'Check soil drainage around plants.'],
                'whenToSeekExpertHelp' => ['Request expert support if symptoms spread quickly across your plot.'],
                'uncertaintyNote' => 'No live AI diagnosis was generated.',
            ];
        }

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=' . urlencode($apiKey);
        $payload = json_encode([
            'systemInstruction' => [
                'parts' => [[
                    'text' => 'You are an inclusive agricultural advisory assistant supporting smallholder farmers in Liberia. Never claim a definitive diagnosis without field inspection.'
                ]]
            ],
            'contents' => [[
                'parts' => [[
                    'text' => "Crop context: " . ($cropSlug ?: 'general') . "\nFarmer question: " . $clean
                ]]
            ]]
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload,
        ]);
        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $httpCode >= 400) {
            return [
                'providerMode' => 'unavailable_demo',
                'modelUsed' => null,
                'disclaimer' => 'Upstream AI service unavailable. Please check approved crop guides or contact an expert.',
                'summary' => 'Unable to reach AI advisor right now.',
                'possibleCauses' => [],
                'clarifyingQuestions' => [],
                'practicalLowRiskSteps' => ['Review downloaded or published crop guides.'],
                'whenToSeekExpertHelp' => ['Submit your question to an approved agricultural expert.'],
                'uncertaintyNote' => 'Upstream AI provider error.',
            ];
        }

        $decoded = json_decode($raw, true);
        $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? 'Guidance generated.';

        return [
            'providerMode' => 'live_gemini',
            'modelUsed' => 'gemini-4-hydrogen',
            'disclaimer' => 'AI-assisted educational guidance; confirm with an agricultural expert for serious crop loss.',
            'summary' => $text,
            'possibleCauses' => [],
            'clarifyingQuestions' => [],
            'practicalLowRiskSteps' => [],
            'whenToSeekExpertHelp' => [],
            'uncertaintyNote' => 'Confirm field symptoms before applying treatments.',
        ];
    }
}
