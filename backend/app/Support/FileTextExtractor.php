<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class FileTextExtractor
{
    /**
     * Extract text from various file formats
     *
     * @param string $filePath The storage path to the file
     * @param string $mimeType The MIME type of the file
     * @return string Extracted text
     */
    public static function extractText(string $filePath, string $mimeType = ''): string
    {
        // Try both public and default storage disks
        $fullPath = null;
        if (file_exists(Storage::path($filePath))) {
            $fullPath = Storage::path($filePath);
        } elseif (file_exists(Storage::disk('public')->path($filePath))) {
            $fullPath = Storage::disk('public')->path($filePath);
        } else {
            // Try direct path
            $fullPath = $filePath;
        }

        if (!file_exists($fullPath)) {
            \Log::warning('FileTextExtractor: File not found', ['filePath' => $filePath, 'fullPath' => $fullPath ?? 'null']);
            return '';
        }

        // Detect MIME type if not provided or is generic
        if (!$mimeType || $mimeType === 'application/octet-stream') {
            $detectedMime = mime_content_type($fullPath) ?: '';
            if ($detectedMime && $detectedMime !== 'application/octet-stream') {
                $mimeType = $detectedMime;
            }
        }

        // Try based on file extension as fallback
        if (!$mimeType || $mimeType === 'application/octet-stream') {
            $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
            $mimeType = match ($ext) {
                'txt' => 'text/plain',
                'pdf' => 'application/pdf',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                default => $mimeType ?: 'text/plain',
            };
        }

        return match (true) {
            str_contains($mimeType, 'text/plain') => static::extractFromTxt($fullPath),
            str_contains($mimeType, 'application/pdf') => static::extractFromPdf($fullPath),
            str_contains($mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml') => static::extractFromDocx($fullPath),
            str_contains($mimeType, 'application/vnd.openxmlformats-officedocument.presentationml') => static::extractFromPptx($fullPath),
            str_contains($mimeType, 'text/') => static::extractFromTxt($fullPath),
            default => static::extractFromTxt($fullPath), // Try text extraction as fallback
        };
    }

    /**
     * Extract text from TXT files
     */
    private static function extractFromTxt(string $filePath): string
    {
        $content = file_get_contents($filePath);
        return $content ?: '';
    }

    /**
     * Extract text from PDF files using regex/simple parsing
     */
    private static function extractFromPdf(string $filePath): string
    {
        try {
            $content = file_get_contents($filePath);
            if (!$content) {
                return '';
            }

            // Try to extract text streams from PDF
            $text = '';

            // Decode PDF streams (basic extraction)
            if (preg_match_all('/stream\s*\n(.*?)\nendstream/is', $content, $matches)) {
                foreach ($matches[1] as $stream) {
                    // Try to decode if it's compressed
                    if (strpos($stream, 'FlateDecode') !== false) {
                        $decoded = @gzuncompress($stream);
                        $text .= $decoded ?: '';
                    } else {
                        $text .= $stream;
                    }
                }
            }

            // Clean up the extracted text
            $text = preg_replace('/\s+/', ' ', $text);
            $text = preg_replace('/[^\w\s.!?,-]/u', '', $text);

            return $text ?: static::extractFromPdfFallback($filePath);
        } catch (\Throwable $e) {
            return static::extractFromPdfFallback($filePath);
        }
    }

    /**
     * Fallback PDF extraction using shell command if available
     */
    private static function extractFromPdfFallback(string $filePath): string
    {
        // Try using pdftotext if available
        if (shell_exec('which pdftotext 2>/dev/null')) {
            $tempFile = tempnam(sys_get_temp_dir(), 'pdf_');
            @shell_exec("pdftotext " . escapeshellarg($filePath) . " " . escapeshellarg($tempFile) . " 2>/dev/null");
            if (file_exists($tempFile)) {
                $text = file_get_contents($tempFile);
                @unlink($tempFile);
                return $text ?: '';
            }
        }

        return '';
    }

    /**
     * Extract text from DOCX files (which are ZIP archives)
     */
    private static function extractFromDocx(string $filePath): string
    {
        try {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                // DOCX files store text in document.xml
                $xml = $zip->getFromName('word/document.xml');
                $zip->close();

                if ($xml) {
                    return static::extractTextFromDocumentXml($xml);
                }
            }
        } catch (\Throwable $e) {
            // Silently fail and try fallback
        }

        return '';
    }

    /**
     * Extract text from PPTX files (which are ZIP archives)
     */
    private static function extractFromPptx(string $filePath): string
    {
        try {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $text = '';

                // Extract text from all slide XMLs
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $stat = $zip->statIndex($i);
                    if (preg_match('/^ppt\/slides\/slide\d+\.xml$/', $stat['name'])) {
                        $xml = $zip->getFromIndex($i);
                        if ($xml) {
                            $text .= ' ' . static::extractTextFromDocumentXml($xml);
                        }
                    }
                }

                $zip->close();
                return $text;
            }
        } catch (\Throwable $e) {
            // Silently fail
        }

        return '';
    }

    /**
     * Extract text from Office Open XML format
     */
    private static function extractTextFromDocumentXml(string $xml): string
    {
        try {
            $dom = new \DOMDocument();
            $dom->loadXML($xml);

            // Extract all text elements
            $text = '';
            $xpath = new \DOMXPath($dom);

            // For DOCX: text nodes are in <w:t> tags
            $textNodes = $xpath->query('//w:t', $dom->documentElement);
            foreach ($textNodes as $node) {
                $text .= $node->nodeValue . ' ';
            }

            // For PPTX: text nodes can be in <a:t> tags
            $textNodes = $xpath->query('//a:t', $dom->documentElement);
            foreach ($textNodes as $node) {
                $text .= $node->nodeValue . ' ';
            }

            return trim($text);
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * Get summary of file content with line count
     */
    public static function getContentSummary(string $filePath, string $mimeType = ''): array
    {
        $text = static::extractText($filePath, $mimeType);
        $lines = array_filter(array_map('trim', explode("\n", $text)));
        $sentences = array_filter(preg_split('/(?<=[.!?])\s+/', $text));

        return [
            'total_chars' => strlen($text),
            'total_lines' => count($lines),
            'total_sentences' => count($sentences),
            'preview' => substr($text, 0, 500),
        ];
    }
}
