import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { OfferCandidate } from '../types.js';

interface VerificationResult {
  offer: OfferCandidate;
  verified: boolean;
  error?: string;
  screenshotPath?: string;
}

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

async function captureFailureScreenshot(page: any, offer: OfferCandidate): Promise<string> {
  const folder = path.join(process.cwd(), 'artifacts', 'verification');
  await mkdir(folder, { recursive: true });
  const filename = `${offer.source}-${Date.now()}.png`;
  const fullPath = path.join(folder, filename);
  await page.screenshot({ path: fullPath, fullPage: true });
  return fullPath;
}

export async function verifyWithPlaywright(offer: OfferCandidate): Promise<VerificationResult> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(offer.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    let totalText: string | null = null;
    let feeText: string | null = null;
    let priceText: string | null = null;

    if (offer.verificationHints?.totalSelector) {
      totalText = await page.locator(offer.verificationHints.totalSelector).first().textContent();
    }

    if (!totalText && offer.verificationHints?.priceSelector) {
      priceText = await page.locator(offer.verificationHints.priceSelector).first().textContent();
    }

    if (!totalText && offer.verificationHints?.feeSelector) {
      feeText = await page.locator(offer.verificationHints.feeSelector).first().textContent();
    }

    const totalPrice = totalText ? parsePrice(totalText) : null;
    const basePrice = priceText ? parsePrice(priceText) : null;
    const feePrice = feeText ? parsePrice(feeText) : null;

    if (totalPrice !== null) {
      offer.totalPrice = totalPrice;
      offer.verified = true;
      offer.confidence = Math.min(1, offer.confidence + 0.3);
      return { offer, verified: true };
    }

    if (basePrice !== null) {
      offer.basePrice = basePrice;
      if (feePrice !== null) {
        offer.fees = feePrice;
        offer.totalPrice = basePrice + feePrice;
      } else {
        offer.totalPrice = basePrice;
      }
      offer.verified = true;
      offer.confidence = Math.min(1, offer.confidence + 0.2);
      return { offer, verified: true };
    }

    const screenshotPath = await captureFailureScreenshot(page, offer);
    return {
      offer,
      verified: false,
      error: 'Unable to locate total price on page.',
      screenshotPath,
    };
  } catch (error) {
    const screenshotPath = await captureFailureScreenshot(page, offer);
    return {
      offer,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
      screenshotPath,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

export async function writeVerificationErrorLog(offer: OfferCandidate, error: string): Promise<void> {
  const folder = path.join(process.cwd(), 'artifacts', 'verification');
  await mkdir(folder, { recursive: true });
  const filename = `${offer.source}-${Date.now()}.log`;
  const fullPath = path.join(folder, filename);
  await writeFile(fullPath, `[${new Date().toISOString()}] ${error}\nURL: ${offer.url}\n`);
}
