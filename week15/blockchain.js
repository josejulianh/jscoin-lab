// JScoin - Semana/Día 15: Scripts básicos educativos (locking/unlocking)
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: Bitcoin Script real, opcodes completos, verificación criptográfica avanzada, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// ---------- Opcodes educativos simplificados ----------
const OP = {
  DUP: 'OP_DUP',
  HASH160: 'OP_HASH160',
  EQUALVERIFY: 'OP_EQUALVERIFY',
  CHECKSIG: 'OP_CHECKSIG',
  EQUAL: 'OP_EQUAL',
  PUSH: 'OP_PUSH'
};

function hash160(data) {
  const sha = crypto.createHash('sha256').update(data).digest();
  return crypto.createHash('ripemd160').update(sha).digest('hex');
}

// Evaluador de script muy simplificado
function executeScript(unlocking, locking, txHash) {
  const stack = [];
  const fullScript = [...unlocking, ...locking];

  for (const item of fullScript) {
    if (typeof item === 'string' && item.startsWith('OP_')) {
      switch (item) {
        case OP.DUP:
          if (stack.length < 1) return false;
          stack.push(stack[stack.length - 1]);
          break;
        case OP.HASH160:
          if (stack.length < 1) return false;
          const top = stack.pop();
          stack.push(hash160(top));
          break;
        case OP.EQUALVERIFY:
          if (stack.length < 2) return false;
          const a = stack.pop();
          const b = stack.pop();
          if (a !== b) return false;
          break;
        case OP.EQUAL:
          if (stack.length < 2) return false;
          const x = stack.pop();
          const y = stack.pop();
          stack.push(x === y);
          break;
        case OP.CHECKSIG:
          // Simulación educativa: se espera firma y pubkey en stack
          if (stack.length < 2) return false;
          const pubKey = stack.pop();
          const sig = stack.pop();
          try {
            const key = ec.keyFromPublic(pubKey, 'hex');
            const valid = key.verify(txHash, sig);
            stack.push(valid);
          } catch (e) {
            stack.push(false);
          }
          break;
        default:
          return false;
      }
    } else {
      // Dato (firma, pubkey, hash, etc.)
      stack.push(item);
    }
  }
  return stack.length > 0 && stack[stack.length - 1] === true;
}

// ---------- Clases ----------
class Transaction {
  constructor(inputs = [], outputs = []) {
    this.inputs = inputs; // { txId, outputIndex, unlockingScript: [] }
    this.outputs = outputs; // { amount, lockingScript: [] }
    this.timestamp = Date.now();
    this.id = crypto.randomBytes(16).toString('hex');
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.inputs) + JSON.stringify(this.outputs) + this.timestamp + this.id)
      .digest('hex');
  }

  // Crea un unlocking script simple para P2PKH educativo
  createUnlockingScript(signingKey) {
    const pubKey = signingKey.getPublic('hex');
    const sig = signingKey.sign(this.hash, 'base64').toDER('hex');
    return [sig, pubKey];
  }

  isValid(utxoSet) {
    if (this.inputs.length === 0) {
      // Coinbase
      return this.outputs.length >= 1 && this.outputs.every(o => o.amount > 0);
    }

    let inputSum = 0;
    for (const input of this.inputs) {
      const key = input.txId + ':' + input.outputIndex;
      const utxo = utxoSet.get(key);
      if (!utxo) return false;

      // Ejecutar scripts
      if (!executeScript(input.unlockingScript || [], utxo.lockingScript || [], this.hash)) {
        return false;
      }
      inputSum += utxo.amount;
    }

    const outputSum = this.outputs.reduce((s, o) => s + o.amount, 0);
    if (outputSum > inputSum) return false; // sin fees negativos
    return true;
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '', difficulty = 2) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce + this.difficulty)
      .digest('hex');
  }

  mineBlock() {
    const target = '0'.repeat(this.difficulty);
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.utxoSet = new Map();
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Coinbase con locking script simple (P2PKH educativo)
  createCoinbase(address) {
    const pubKeyHash = hash160(address); // address aquí es la pubkey hex para demo
    const locking = [OP.DUP, OP.HASH160, pubKeyHash, OP.EQUALVERIFY, OP.CHECKSIG];
    return new Transaction([], [{ amount: this.miningReward, lockingScript: locking }]);
  }

  addTransaction(tx) {
    if (!tx.isValid(this.utxoSet)) {
      throw new Error('Transacción no válida (script o montos)');
    }
    this.pendingTransactions.push(tx);
  }

  updateUTXOSet(block) {
    for (const tx of block.transactions) {
      for (const input of tx.inputs) {
        this.utxoSet.delete(input.txId + ':' + input.outputIndex);
      }
      tx.outputs.forEach((output, index) => {
        this.utxoSet.set(tx.id + ':' + index, {
          amount: output.amount,
          lockingScript: output.lockingScript || []
        });
      });
    }
  }

  minePendingTransactions(miningRewardAddress) {
    const coinbase = this.createCoinbase(miningRewardAddress);
    const block = new Block(
      Date.now(),
      [coinbase, ...this.pendingTransactions],
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();
    this.updateUTXOSet(block);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  getBalanceOfAddress(address) {
    // Para demo: sumar UTXOs cuyo locking script contenga el hash de la pubkey
    const targetHash = hash160(address);
    let balance = 0;
    for (const [, utxo] of this.utxoSet) {
      if (utxo.lockingScript && utxo.lockingScript.includes(targetHash)) {
        balance += utxo.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex'); // usamos pubkey como "address" educativo
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 15: Scripts básicos educativos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const alice = new Wallet();
const bob = new Wallet();

const jscoin = new Blockchain();

// Minar recompensa para Alice
console.log('Minando bloque con recompensa para Alice...');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}\n`);

// Crear transacción Alice -> Bob usando scripts
console.log('Creando transacción con unlocking script correcto...');
const utxos = [];
for (const [key, utxo] of jscoin.utxoSet) {
  utxos.push({ key, ...utxo });
}
if (utxos.length > 0) {
  const [txId, idx] = utxos[0].key.split(':');
  const tx = new Transaction(
    [{ txId, outputIndex: parseInt(idx) }],
    [
      { amount: 20, lockingScript: [OP.DUP, OP.HASH160, hash160(bob.address), OP.EQUALVERIFY, OP.CHECKSIG] },
      { amount: 30, lockingScript: [OP.DUP, OP.HASH160, hash160(alice.address), OP.EQUALVERIFY, OP.CHECKSIG] }
    ]
  );
  // Añadir unlocking script correcto
  tx.inputs[0].unlockingScript = tx.createUnlockingScript(alice.keyPair);

  try {
    jscoin.addTransaction(tx);
    console.log('✓ Transacción válida aceptada');
  } catch (e) {
    console.log('✗ Error inesperado:', e.message);
  }

  // Intento con unlocking script incorrecto
  console.log('\nIntentando con unlocking script incorrecto...');
  const badTx = new Transaction(
    [{ txId, outputIndex: parseInt(idx), unlockingScript: ['firma_falsa', 'pubkey_falsa'] }],
    [{ amount: 20, lockingScript: utxos[0].lockingScript }]
  );
  try {
    jscoin.addTransaction(badTx);
    console.log('✗ ERROR: se aceptó una tx inválida');
  } catch (e) {
    console.log('✓ Correctamente rechazada:', e.message);
  }
}

console.log('\nMinando el bloque con la transacción...');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice final: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob: ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log(`Cadena válida: ${jscoin.isChainValid()}`);
console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo de scripts. En Bitcoin real el lenguaje de scripts es mucho más rico y seguro.');
