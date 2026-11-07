// JScoin - Semana/Día 12: Contratos inteligentes básicos educativos
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: EVM, gas real, sandbox seguro, red P2P, seguridad de producción, etc.

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
  constructor(fromAddress, toAddress, amount, data = null) {
    if (amount < 0) throw new Error('El importe no puede ser negativo');
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.data = data; // { type: 'deploy' | 'call', method, params, contractAddress }
    this.timestamp = Date.now();
    this.signature = null;
    this.id = crypto.randomBytes(8).toString('hex');
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + JSON.stringify(this.data) + this.timestamp + this.id)
      .digest('hex');
  }

  sign(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('No puedes firmar transacciones de otras wallets');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    if (this.fromAddress === null) return true;
    if (!this.signature || this.signature.length === 0) return false;
    if (this.amount < 0) return false;
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

// ========== CONTRATO EDUCATIVO ==========
class SimpleStorage {
  constructor(owner) {
    this.owner = owner;
    this.value = 0;
    this.address = crypto.randomBytes(20).toString('hex'); // dirección simulada
  }

  // Métodos que se pueden "llamar"
  set(value) {
    if (typeof value !== 'number' || value < 0) throw new Error('Valor inválido');
    this.value = value;
    return this.value;
  }

  increment() {
    this.value += 1;
    return this.value;
  }

  get() {
    return this.value;
  }

  // Ejecuta una llamada según el data de la transacción
  execute(method, params = []) {
    if (typeof this[method] !== 'function') {
      throw new Error(`Método ${method} no existe`);
    }
    return this[method](...params);
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
      .update(
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce +
        this.difficulty
      )
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

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) return false;
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.contracts = new Map(); // address -> instance
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Despliega un contrato (transacción especial)
  deployContract(ownerAddress, signingKey) {
    const contract = new SimpleStorage(ownerAddress);
    const tx = new Transaction(
      ownerAddress,
      null,
      0,
      { type: 'deploy', contractAddress: contract.address }
    );
    tx.sign(signingKey);
    this.addTransaction(tx);
    this.contracts.set(contract.address, contract);
    console.log(`Contrato desplegado en: ${contract.address}`);
    return contract.address;
  }

  // Llama a un método de un contrato
  callContract(fromAddress, contractAddress, method, params, signingKey) {
    if (!this.contracts.has(contractAddress)) {
      throw new Error('Contrato no encontrado');
    }
    const tx = new Transaction(
      fromAddress,
      contractAddress,
      0,
      { type: 'call', method, params, contractAddress }
    );
    tx.sign(signingKey);
    this.addTransaction(tx);
    return tx;
  }

  // Procesa llamadas a contratos al minar
  processContractCalls(block) {
    for (const tx of block.transactions) {
      if (tx.data && tx.data.type === 'call') {
        const contract = this.contracts.get(tx.data.contractAddress);
        if (contract) {
          try {
            const result = contract.execute(tx.data.method, tx.data.params || []);
            console.log(`  Llamada ${tx.data.method} → resultado: ${result}`);
          } catch (e) {
            console.log(`  Error en llamada: ${e.message}`);
          }
        }
      }
    }
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();

    this.processContractCalls(block);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress && transaction.amount > 0) {
      // recompensa de minado ok
    } else if (!transaction.isValid()) {
      throw new Error('Transacción no válida');
    }
    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) balance -= trans.amount;
        if (trans.toAddress === address) balance += trans.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (!current.hasValidTransactions()) return false;
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
      if (current.hash.substring(0, current.difficulty) !== '0'.repeat(current.difficulty)) return false;
    }
    return true;
  }

  getContractState(address) {
    const c = this.contracts.get(address);
    return c ? { address: c.address, owner: c.owner, value: c.value } : null;
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  createTransaction(toAddress, amount) {
    const tx = new Transaction(this.address, toAddress, amount);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== DEMO EJECUTABLE Y VERIFICABLE ==========
console.log('=== JScoin Lab - Práctica 12: Contratos inteligentes básicos ===');
console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

const jscoin = new Blockchain();
const alice = new Wallet();
const bob = new Wallet();

console.log('Alice:', alice.address.substring(0, 20) + '...');
console.log('Bob:  ', bob.address.substring(0, 20) + '...\n');

// Minar recompensa inicial
jscoin.minePendingTransactions(alice.address);
console.log(`Saldo Alice: ${jscoin.getBalanceOfAddress(alice.address)}\n`);

// Desplegar contrato
console.log('--- Desplegando SimpleStorage ---');
const contractAddr = jscoin.deployContract(alice.address, alice.keyPair);
jscoin.minePendingTransactions(alice.address);

console.log('Estado inicial:', jscoin.getContractState(contractAddr));

// Llamadas al contrato
console.log('\n--- Llamadas al contrato ---');
jscoin.callContract(alice.address, contractAddr, 'set', [42], alice.keyPair);
jscoin.minePendingTransactions(alice.address);

jscoin.callContract(alice.address, contractAddr, 'increment', [], alice.keyPair);
jscoin.callContract(bob.address, contractAddr, 'increment', [], bob.keyPair);
jscoin.minePendingTransactions(alice.address);

console.log('\nEstado final del contrato:', jscoin.getContractState(contractAddr));
console.log(`\n¿Cadena válida?: ${jscoin.isChainValid()}`);
console.log(`Saldo final Alice: ${jscoin.getBalanceOfAddress(alice.address)}`);
console.log(`Saldo final Bob: ${jscoin.getBalanceOfAddress(bob.address)}`);

console.log('\n--- Fin de la demostración ---');
console.log('Este es un prototipo educativo. En producción se usa EVM/Solidity, gas, sandbox,');
console.log('ABI formal, eventos, y muchas más garantías de seguridad.');
