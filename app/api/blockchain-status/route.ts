import { NextRequest, NextResponse } from 'next/server';
import { isBlockchainEnabled } from '@/lib/blockchain';

export async function GET(req: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
  
  return NextResponse.json({
    blockchainEnabled: isBlockchainEnabled(),
    appId: appId || 'NOT SET',
    appIdNumber: appId ? parseInt(appId) : 0,
    hasDeployerKey: !!deployerMnemonic,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasAppId: !!process.env.NEXT_PUBLIC_APP_ID,
      appIdValue: process.env.NEXT_PUBLIC_APP_ID,
    },
    debug: {
      rawAppId: process.env.NEXT_PUBLIC_APP_ID,
      parsedAppId: process.env.NEXT_PUBLIC_APP_ID ? parseInt(process.env.NEXT_PUBLIC_APP_ID) : 0,
      isGreaterThanZero: (process.env.NEXT_PUBLIC_APP_ID ? parseInt(process.env.NEXT_PUBLIC_APP_ID) : 0) > 0
    }
  });
}
