const { CredentialsManager } = require('../src/config/credentialsManager');

async function storePaymentInfo() {
  const credentialsManager = CredentialsManager.getInstance();
  
  const paymentInfo = {
    name: "Dean Stamos",
    address: "811 South Drive, Brick Township, NJ 08724",
    phone: "(917) 348 5347",
    ssn: "148707627",
    email: "dean@divvytech.com",
    bankName: "Wells Fargo Bank",
    accountNumber: "1542287881",
    routingNumber: "021200025",
    swiftCode: "WFBIUS6S"
  };

  try {
    await credentialsManager.storePaymentInfo(paymentInfo);
    console.log('Payment information stored securely');
  } catch (error) {
    console.error('Failed to store payment information:', error);
    process.exit(1);
  }
}

storePaymentInfo();
