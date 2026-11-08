// JScoin - Semana/Día 13: Modelo UTXO básico educativo
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: scripts reales, serialización Bitcoin, fees complejas, red P2P, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(inputs = [], outputs = []) {
    this.inputs = inputs;   // [{ txId, outputIndex, signature, publicKey }]
    this.outputs = outputs; // [{ address, amount }]
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

  // Firma los inputs (simplificado: una firma por input usando la clave del propietario)
  signInputs(signingKey) {
    const publicKey = signingKey.getPublic('hex');
    const hash = this.calculateHash();
    const signature = signingKey.sign(hash, 'base64').toDER('hex');

    this.inputs.forEach(input => {
      input.signature = signature;
      input.publicKey = publicKey;
    });
  }

  isValid(utxoSet) {
    if (this.inputs.length === 0) {
      // Coinbase / recompensa: válida si tiene exactamente un output
      return this.outputs.length === 1 && this.outputs[0].amount > 0;
    }

    let inputSum = 0;
    for (const input of this.inputs) {
      const utxo = utxoSet.get(input.txId + ':' + input.outputIndex);
      if (!utxo) return false; // UTXO no existe o ya gastado
      if (utxo.address !== input.publicKey) return false;

      // Verificar firma (simplificado)
      if (!input.signature) return false;
      const key = ec.keyFromPublic(input.publicKey, 'hex');
      if (!key.verify(this.calculateHash(), input.signature)) return false;

      inputSum += utxo.amount;
    }

    const outputSum = this.outputs.reduce((sum, o) => sum + o.amount, 0);
    if (outputSum > inputSum) return false; // No se puede gastar más de lo que se tiene

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
    const start = Date.now();
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Bloque minado: ${this.hash.substring(0, 16)}... (diff: ${this.difficulty}, nonce: ${this.nonce}, ${Date.now() - start}ms)`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.utxoSet = new Map(); // key: "txId:outputIndex" -> { address, amount }
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Crea un UTXO de recompensa (coinbase)
  createCoinbase(address) {
    const tx = new Transaction([], [{ address, amount: this.miningReward }]);
    return tx;
  }

  // Añade una transacción normal (el llamador debe haber firmado los inputs)
  addTransaction(tx) {
    if (!tx.isValid(this.utxoSet)) {
      throw new Error('Transacción no válida (UTXO no existe, firma incorrecta o importe excesivo)');
    }
    this.pendingTransactions.push(tx);
  }

  // Actualiza el conjunto de UTXOs al añadir un bloque
  updateUTXOSet(block) {
    for (const tx of block.transactions) {
      // Eliminar inputs (gastados)
      for (const input of tx.inputs) {
        this.utxoSet.delete(input.txId + ':' + input.outputIndex);
      }
      // Añadir nuevos outputs
      tx.outputs.forEach((output, index) => {
        this.utxoSet.set(tx.id + ':' + index, {
          address: output.address,
          amount: output.amount
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

  // Saldo = suma de UTXOs de esa dirección
  getBalanceOfAddress(address) {
    let balance = 0;
    for (const [key, utxo] of this.utxoSet) {
      if (utxo.address === address) balance += utxo.amount;
    }
    return balance;
  }

  getUTXOsOfAddress(address) {
    const result = [];
    for (const [key, utxo] of this.utxoSet) {
      if (utxo.address === address) {
        result.push({ key, ...utxo });
      }
    }
    return result;
  }

  isChainValid() {
    // Validación simplificada de la cadena (hashes y PoW)
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
    this.address = this.keyPair.getPublic('hex');
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 13: Modelo UTXO básico educativo ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const jscoin = new Blockchain();
const alice = new Wallet();
const bob = new Wallet();

console.log('Alice:', alice.address.substring(0, 24) + '...');
console.log('Bob:  ', bob.address.substring(0, 24) + '...\n');

// Minar recompensa para Alice
console.log('--- Minando recompensa para Alice ---');
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log('UTXOs Alice:', jscoin.getUTXOsOfAddress(alice.address));

// Alice envía 20 a Bob (usando su UTXO de 50, genera cambio de 30)
console.log('\n--- Alice envía 20 a Bob ---');
const aliceUTXOs = jscoin.getUTXOsOfAddress(alice.address);
const inputKey = aliceUTXOs[0].key; // "txId:0"
const [txId, outputIndex] = inputKey.split(':');

const tx = new Transaction(
  [{ txId, outputIndex: parseInt(outputIndex) }],
  [
    { address: bob.address, amount: 20 },
    { address: alice.address, amount: 30 } // cambio
  ]
);
tx.signInputs(alice.keyPair);
jscoin.addTransaction(tx);

jscoin.minePendingTransactions(alice.address); // minero recibe otra recompensa

console.log(`\nSaldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo Bob:   ${jscoin.getBalanceOfAddress(bob.address)}`);
console.log('UTXOs Alice:', jscoin.getUTXOsOfAddress(alice.address));
console.log('UTXOs Bob:  ', jscoin.getUTXOsOfAddress(bob.address));

console.log(`\n¿Cadena válida?: ${jscoin.isChainValid()}`);

// Intento de double-spend (debería fallar)
console.log('\n--- Intento de double-spend ---');
try {
  const badTx = new Transaction(
    [{ txId, outputIndex: parseInt(outputIndex) }], // mismo UTXO ya gastado
    [{ address: bob.address, amount: 10 }]
  );
  badTx.signInputs(alice.keyPair);
  jscoin.addTransaction(badTx);
} catch (e) {
  console.log('Double-spend rechazado correctamente:', e.message);
}

console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo del modelo UTXO.');
console.log('En Bitcoin real se usan scripts, serialización específica, fees, y una base de datos UTXO optimizada.');
