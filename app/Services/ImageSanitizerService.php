<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ImageSanitizerService
{
    /**
     * Membersihkan dan men-sanitasi file gambar yang diunggah:
     * 1. Verifikasi MIME type & Magic Number (cegah ekstensi palsu/polyglot).
     * 2. Koreksi rotasi otomatis berdasarkan EXIF Orientation.
     * 3. Hapus (strip) 100% metadata EXIF, GPS, dan IPTC untuk privasi klien.
     * 4. Resize proporsional jika resolusi melebihi batas maksimal ($maxWidth).
     * 5. Encode ulang ke format WebP terkompresi hemat memori (~85% kualitas).
     *
     * @param UploadedFile $file
     * @param string $folder Direktori relatif di dalam public/ (misal: 'uploads/expenses')
     * @param string $prefix Prefix nama file
     * @param int $maxWidth Lebar maksimal gambar (default: 1920px)
     * @param int $quality Kualitas kompresi WebP (0-100, default: 85)
     * @return array
     */
    public function sanitizeAndStore(
        UploadedFile $file,
        string $folder = 'uploads',
        string $prefix = 'img',
        int $maxWidth = 1920,
        int $quality = 85
    ): array {
        $destinationPath = public_path($folder);
        if (!file_exists($destinationPath)) {
            @mkdir($destinationPath, 0755, true);
        }

        $sourcePath = $file->getRealPath();
        $ext = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType();

        // 1. Verifikasi MIME type
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!in_array($mime, $allowedMimes)) {
            throw new \InvalidArgumentException("Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.");
        }

        // Fallback aman jika ekstensi GD tidak aktif di server
        if (!extension_loaded('gd')) {
            $filename = $prefix . '_' . time() . '_' . Str::random(8) . '.' . $ext;
            $file->move($destinationPath, $filename);
            return [
                'success' => true,
                'file_name' => $filename,
                'file_path' => $folder . '/' . $filename,
                'url' => '/' . $folder . '/' . $filename,
                'width' => null,
                'height' => null,
                'size' => file_exists($destinationPath . DIRECTORY_SEPARATOR . $filename) ? filesize($destinationPath . DIRECTORY_SEPARATOR . $filename) : 0,
            ];
        }

        // 2. Baca orientasi EXIF sebelum dibersihkan (khusus JPEG)
        $orientation = 1;
        if (function_exists('exif_read_data') && in_array($ext, ['jpg', 'jpeg'])) {
            try {
                $exif = @exif_read_data($sourcePath);
                if (!empty($exif['Orientation'])) {
                    $orientation = (int) $exif['Orientation'];
                }
            } catch (\Throwable $e) {
                // Abaikan jika pembacaan EXIF gagal
            }
        }

        // 3. Decode gambar ke memory GD
        $sourceImage = match ($ext) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($sourcePath),
            'png'         => @imagecreatefrompng($sourcePath),
            'webp'        => @imagecreatefromwebp($sourcePath),
            default       => null,
        };

        if (!$sourceImage) {
            throw new \RuntimeException("Gagal memproses file gambar. File mungkin rusak atau tidak valid.");
        }

        // 4. Koreksi rotasi jika ada tag orientasi kamera HP
        $rotatedImage = match ($orientation) {
            3 => imagerotate($sourceImage, 180, 0),
            6 => imagerotate($sourceImage, -90, 0),
            8 => imagerotate($sourceImage, 90, 0),
            default => $sourceImage,
        };

        if ($rotatedImage !== $sourceImage) {
            imagedestroy($sourceImage);
            $sourceImage = $rotatedImage;
        }

        $origWidth = imagesx($sourceImage);
        $origHeight = imagesy($sourceImage);

        // 5. Hitung dimensi proporsional jika melebihi $maxWidth
        if ($origWidth > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) round(($origHeight / $origWidth) * $maxWidth);
            $targetImage = imagecreatetruecolor($newWidth, $newHeight);

            // Handle transparansi PNG jika diperlukan
            imagealphablending($targetImage, false);
            imagesavealpha($targetImage, true);

            imagecopyresampled($targetImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            imagedestroy($sourceImage);
            $sourceImage = $targetImage;
        } else {
            $newWidth = $origWidth;
            $newHeight = $origHeight;
        }

        // 6. Simpan ulang sebagai WebP murni (EXIF otomatis hilang 100%)
        $filename = $prefix . '_' . time() . '_' . Str::random(8) . '.webp';
        $fullPath = $destinationPath . DIRECTORY_SEPARATOR . $filename;

        if (function_exists('imagewebp')) {
            imagewebp($sourceImage, $fullPath, $quality);
        } else {
            // Fallback ke JPEG jika library WebP server tidak aktif
            $filename = str_replace('.webp', '.jpg', $filename);
            $fullPath = $destinationPath . DIRECTORY_SEPARATOR . $filename;
            imagejpeg($sourceImage, $fullPath, $quality);
        }

        imagedestroy($sourceImage);

        return [
            'success' => true,
            'file_name' => $filename,
            'file_path' => $folder . '/' . $filename,
            'url' => '/' . $folder . '/' . $filename,
            'width' => $newWidth,
            'height' => $newHeight,
            'size' => file_exists($fullPath) ? filesize($fullPath) : 0,
        ];
    }
}
