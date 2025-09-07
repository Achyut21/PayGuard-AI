import algosdk from 'algosdk';

// Algorand node configuration
const algodClient = new algosdk.Algodv2(
  process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.4160.nodely.io',
  443
);

const indexerClient = new algosdk.Indexer(
  process.env.NEXT_PUBLIC_ALGOD_TOKEN || '',
  process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.4160.nodely.io',
  443
);

export async function deployPayGuardContract(
  deployer: algosdk.Account
): Promise<{ appId: number; appAddress: string }> {
  try {
    console.log('Compiling PayGuard AI contract...');
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Compile the contract (this would need TEALScript compiler setup)
    // For now, we'll use placeholder approval and clear programs
    const approvalProgram = new Uint8Array(Buffer.from('#pragma version 10\nint 1', 'utf-8'));
    const clearProgram = new Uint8Array(Buffer.from('#pragma version 10\nint 1', 'utf-8'));
    // Define global and local state schemas
    const localSchema = new algosdk.StateSchema({ numUints: 0, numByteSlices: 0 });
    const globalSchema = new algosdk.StateSchema({ numUints: 10, numByteSlices: 10 }); // Adjust based on actual needs

    // Create application transaction
    const createAppTxn = algosdk.makeApplicationCreateTxnFromObject({
      sender: deployer.addr,
      suggestedParams,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numLocalInts: localSchema.numUints,
      numLocalByteSlices: localSchema.numByteSlices, 
      numGlobalInts: globalSchema.numUints,
      numGlobalByteSlices: globalSchema.numByteSlices,
    });

    // Sign transaction
    const signedTxn = createAppTxn.signTxn(deployer.sk);

    // Submit transaction
    console.log('Deploying contract to blockchain...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      response.txid,
      4
    );

    const appId = confirmedTxn.applicationIndex;
    if (!appId) {
      throw new Error('Failed to get application ID from confirmed transaction');
    }
    const appAddress = algosdk.getApplicationAddress(appId);
    console.log(`✅ Contract deployed successfully!`);
    console.log(`App ID: ${appId}`);
    console.log(`App Address: ${appAddress}`);

    return { appId: Number(appId), appAddress: String(appAddress) };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

// Helper function to compile TEALScript to TEAL
export async function compileTealScript(source: string): Promise<Uint8Array> {
  // In a real implementation, this would compile TEALScript to TEAL
  // For now, return a placeholder
  return new Uint8Array(Buffer.from('#pragma version 10\nint 1', 'utf-8'));
}

// Fund an account (for testing)
export async function fundAccount(
  address: string,
  amount: number = 10000000 // 10 ALGO
): Promise<void> {
  try {
    // This would use the TestNet dispenser in a real implementation
    console.log(`Funding account ${address} with ${amount / 1000000} ALGO`);
    // For TestNet, you would make a request to:
    // https://bank.testnet.algorand.network/
  } catch (error) {
    console.error('Error funding account:', error);
    throw error;
  }
}