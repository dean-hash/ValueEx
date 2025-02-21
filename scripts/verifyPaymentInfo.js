const { CredentialsManager } = require('../src/config/credentialsManager');

async function verifyPaymentInfo() {
  const credentialsManager = CredentialsManager.getInstance();
  
  try {
    const info = await credentialsManager.getPaymentInfo();
    if (info) {
      console.log('Payment information retrieved successfully:');
      console.log('Name:', info.name);
      console.log('Bank:', info.bankName);
      console.log('Account ending in:', info.accountNumber.slice(-4));
      console.log('All payment details are stored securely');
    } else {
      console.log('No payment information found');
    }
  } catch (error) {
    console.error('Failed to retrieve payment information:', error);
    process.exit(1);
  }
}

verifyPaymentInfo();
