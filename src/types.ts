/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AccessCode {
  id: string;
  code: string; // Format: XXXX-XXXX (e.g. A3F9-K2M1)
  url: string;  // Format: https://monsite.com/acces?code=XXXX-XXXX
  qrCodeDataUrlUrl?: string; // For display / download
}

export type TabType = 'ean' | 'qr' | 'access';
