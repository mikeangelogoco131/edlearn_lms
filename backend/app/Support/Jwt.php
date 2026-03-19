<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

final class Jwt
{
    private const ALG = 'HS256';

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function encode(array $payload, ?int $ttlSeconds = null): string
    {
        $issuedAt = time();
        $ttlSeconds = $ttlSeconds ?? (60 * 60 * 24); // 24 hours

        $payload = array_merge([
            'iat' => $issuedAt,
            'exp' => $issuedAt + $ttlSeconds,
        ], $payload);

        $header = ['typ' => 'JWT', 'alg' => self::ALG];

        $headerB64 = self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
        $payloadB64 = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));

        $signingInput = $headerB64.'.'.$payloadB64;
        $signature = hash_hmac('sha256', $signingInput, self::secret(), true);
        $signatureB64 = self::base64UrlEncode($signature);

        return $signingInput.'.'.$signatureB64;
    }

    /**
     * @return array<string, mixed>
     */
    public static function decode(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Malformed token');
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;

        $headerJson = self::base64UrlDecodeToString($headerB64);
        $payloadJson = self::base64UrlDecodeToString($payloadB64);
        $signature = self::base64UrlDecode($sigB64);

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (! is_array($header) || ! is_array($payload)) {
            throw new \RuntimeException('Invalid token json');
        }

        if (($header['alg'] ?? null) !== self::ALG) {
            throw new \RuntimeException('Unsupported alg');
        }

        $signingInput = $headerB64.'.'.$payloadB64;
        $expected = hash_hmac('sha256', $signingInput, self::secret(), true);

        if (! hash_equals($expected, $signature)) {
            throw new \RuntimeException('Bad signature');
        }

        $exp = $payload['exp'] ?? null;
        if (is_numeric($exp) && time() > (int) $exp) {
            throw new \RuntimeException('Token expired');
        }

        return $payload;
    }

    private static function secret(): string
    {
        $key = (string) Config::get('app.key', '');

        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $key;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecodeToString(string $data): string
    {
        $decoded = self::base64UrlDecode($data);

        return $decoded;
    }

    private static function base64UrlDecode(string $data): string
    {
        $data = strtr($data, '-_', '+/');
        $pad = strlen($data) % 4;
        if ($pad) {
            $data .= str_repeat('=', 4 - $pad);
        }

        $decoded = base64_decode($data, true);
        if ($decoded === false) {
            throw new \RuntimeException('Invalid base64');
        }

        return $decoded;
    }
}
