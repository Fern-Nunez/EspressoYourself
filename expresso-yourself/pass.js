const bcrypt = require('bcrypt');

// Function to hash a password
async function hashPassword(password) {
  try {
    // Define the salt rounds
    const saltRounds = 10;

    // Generate the salt and hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Example usage
(async () => {
  const password = 'New#90York';
  const hashedPassword = await hashPassword(password);
  console.log('Hashed Password:', hashedPassword);
})();
