import ExifReader from 'exifreader';
import { EngineResult } from '../../core/types/engine';

export interface ExifTagSummary {
  [tagName: string]: string;
}

export class ExifEngine {
  /**
   * Parse EXIF metadata from an image buffer
   */
  static parseExif(buffer: Uint8Array): EngineResult<ExifTagSummary> {
    const start = performance.now();
    try {
      // ExifReader expects ArrayBuffer or Buffer
      const tags = ExifReader.load(buffer.buffer);
      const summary: ExifTagSummary = {};

      const interestingKeys = [
        'Make',
        'Model',
        'LensModel',
        'LensMake',
        'FocalLength',
        'FNumber',
        'ExposureTime',
        'ISOSpeedRatings',
        'ISO',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'Software',
        'ColorSpace',
        'Image Width',
        'Image Height',
        'Orientation',
        'Flash',
        'WhiteBalance',
        'MeteringMode',
        'ExposureProgram',
        'GPSLatitude',
        'GPSLongitude',
        'GPSAltitude',
      ];

      for (const [key, tag] of Object.entries(tags)) {
        if (!tag || key === 'MakerNote' || key === 'UserComment') continue;

        const isInteresting = interestingKeys.some(
          (k) => k.toLowerCase() === key.toLowerCase()
        );

        if (isInteresting || Object.keys(summary).length < 25) {
          const val = typeof tag === 'object' && 'description' in tag ? (tag as any).description : String(tag);
          if (val && typeof val === 'string') {
            summary[key] = val.trim();
          }
        }
      }

      if (Object.keys(summary).length === 0) {
        summary['Notice'] = 'No standard EXIF metadata tags found in this image file.';
      }

      return {
        success: true,
        data: summary,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}
