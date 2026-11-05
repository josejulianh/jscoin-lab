// JScoin - Semana/Día 10: CLI interactivo, UTXO básico y cierre del laboratorio
// PROTOTIPO EDUCATIVO. NO apto para producción.
// No tiene: red P2P real, consenso de producción, wallets seguros, base de datos, etc.
// Simula CLI interactivo + persistencia + wallets básicos.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const CHAIN_FILE = path.join(__dirname, 'chain.json');
const WALLETS_FILE = path.join(__dirname, 'wallets.json');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    if (amount <= 0) throw new Error('El importe debe ser positivo');
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = null;
    this.id = crypto.randomBytes(8).toString('hex');
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.id)
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
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No hay firma en esta transacción');
    }
    if (this.amount <= 0) return false;
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
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
    this.adjustmentInterval = 4;
    this.targetBlockTime = 8000;
    this.utxos = {}; // Mapa simple educativo: address -> balance (no UTXO real)
  }

  createGenesisBlock() {
    const genesis = new Block(Date.now(), [], '0', 2);
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  adjustDifficulty() {
    if (this.chain.length % this.adjustmentInterval !== 0) return;
    const last = this.getLatestBlock();
    const previous = this.chain[this.chain.length - this.adjustmentInterval];
    const timeExpected = this.targetBlockTime * this.adjustmentInterval;
    const timeActual = last.timestamp - previous.timestamp;
    const oldDiff = this.difficulty;
    if (timeActual < timeExpected * 0.7) {
      this.difficulty = Math.min(this.difficulty + 1, 5);
      console.log(`↑ Dificultad aumentada: ${oldDiff} → ${this.difficulty}`);
    } else if (timeActual > timeExpected * 1.5) {
      this.difficulty = Math.max(this.difficulty - 1, 1);
      console.log(`↓ Dificultad disminuida: ${oldDiff} → ${this.difficulty}`);
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

    this.chain.push(block);
    this.pendingTransactions = [];
    this.adjustDifficulty();
    this.rebuildUTXOs();
    this.saveChain();
    return block;
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('La transacción debe incluir from y to');
    }
    if (!transaction.isValid()) {
      throw new Error('No se puede añadir una transacción no válida');
    }
    if (transaction.fromAddress === transaction.toAddress) {
      throw new Error('No puedes enviar a ti mismo (en este prototipo)');
    }

    const balance = this.getBalanceOfAddress(transaction.fromAddress);
    const pendingOut = this.pendingTransactions
      .filter(tx => tx.fromAddress === transaction.fromAddress)
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (balance - pendingOut < transaction.amount) {
      throw new Error(`Saldo insuficiente. Disponible: ${balance - pendingOut}, intentado: ${transaction.amount}`);
    }

    this.pendingTransactions.push(transaction);
    return true;
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

  rebuildUTXOs() {
    // Prototipo muy simplificado: solo recalcula saldos
    this.utxos = {};
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress) {
          this.utxos[trans.fromAddress] = (this.utxos[trans.fromAddress] || 0) - trans.amount;
        }
        if (trans.toAddress) {
          this.utxos[trans.toAddress] = (this.utxos[trans.toAddress] || 0) + trans.amount;
        }
      }
    }
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

  saveChain() {
    try {
      const data = JSON.stringify({
        chain: this.chain,
        difficulty: this.difficulty
      }, null, 2);
      fs.writeFileSync(CHAIN_FILE, data);
      console.log(`Cadena guardada (${this.chain.length} bloques)`);
    } catch (e) {
      console.error('Error guardando cadena:', e.message);
    }
  }

  loadChain() {
    if (!fs.existsSync(CHAIN_FILE)) {
      console.log('No existe cadena previa. Iniciando desde génesis.');
      return false;
    }
    try {
      const raw = fs.readFileSync(CHAIN_FILE, 'utf8');
      const data = JSON.parse(raw);
      this.chain = data.chain.map(b => {
        const block = Object.assign(new Block(0, [], ''), b);
        block.transactions = b.transactions.map(t => Object.assign(new Transaction(null, null, 1), t));
        return block;
      });
      this.difficulty = data.difficulty || 2;
      if (!this.isChainValid()) {
        console.error('Cadena cargada no válida. Reiniciando.');
        this.chain = [this.createGenesisBlock()];
        return false;
      }
      this.rebuildUTXOs();
      console.log(`Cadena cargada correctamente (${this.chain.length} bloques, diff: ${this.difficulty})`);
      return true;
    } catch (e) {
      console.error('Error cargando cadena:', e.message);
      return false;
    }
  }
}

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic('hex');
  }

  static fromPrivateKey(privateKeyHex) {
    const w = new Wallet();
    w.keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
    w.address = w.keyPair.getPublic('hex');
    return w;
  }

  getPrivateKey() {
    return this.keyPair.getPrivate('hex');
  }

  createTransaction(toAddress, amount) {
    const tx = new Transaction(this.address, toAddress, amount);
    tx.sign(this.keyPair);
    return tx;
  }
}

// ========== CLI INTERACTIVO ==========
const wallets = new Map(); // address -> Wallet

function saveWallets() {
  const data = {};
  for (const [addr, w] of wallets) {
    data[addr] = w.getPrivateKey();
  }
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(data, null, 2));
  console.log('Wallets guardadas (ADVERTENCIA: claves privadas en texto plano - solo educativo)');
}

function loadWallets() {
  if (!fs.existsSync(WALLETS_FILE)) return;
  try {
    const data = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
    for (const [addr, priv] of Object.entries(data)) {
      wallets.set(addr, Wallet.fromPrivateKey(priv));
    }
    console.log(`Cargadas ${wallets.size} wallets`);
  } catch (e) {
    console.error('Error cargando wallets:', e.message);
  }
}

function showMenu() {
  console.log('\n=== JScoin Lab - Práctica 10 (CLI) ===');
  console.log('PROTOTIPO EDUCATIVO - No usar en producción');
  console.log('1. Crear nueva wallet');
  console.log('2. Listar wallets y saldos');
  console.log('3. Minar bloque (recompensa a una wallet)');
  console.log('4. Enviar monedas');
  console.log('5. Mostrar estado de la cadena');
  console.log('6. Guardar todo y salir');
  console.log('0. Salir sin guardar');
}

async function main() {
  console.log('=== JScoin Lab - Práctica 10: CLI interactivo y cierre ===');
  console.log('PROTOTIPO EDUCATIVO - No apto para producción\n');

  const blockchain = new Blockchain();
  blockchain.loadChain();
  loadWallets();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  while (true) {
    showMenu();
    const choice = await ask('\nElige una opción: ');

    try {
      if (choice === '1') {
        const w = new Wallet();
        wallets.set(w.address, w);
        console.log(`Nueva wallet creada: ${w.address.substring(0, 32)}...`);
        console.log(`Clave privada (GUÁRDALA): ${w.getPrivateKey()}`);
      } else if (choice === '2') {
        if (wallets.size === 0) {
          console.log('No hay wallets. Crea una primero.');
        } else {
          for (const [addr, w] of wallets) {
            console.log(`${addr.substring(0, 24)}... → saldo: ${blockchain.getBalanceOfAddress(addr)}`);
          }
        }
      } else if (choice === '3') {
        if (wallets.size === 0) {
          console.log('Crea una wallet primero.');
          continue;
        }
        const addrs = Array.from(wallets.keys());
        console.log('Wallets disponibles:');
        addrs.forEach((a, i) => console.log(`${i}: ${a.substring(0, 24)}...`));
        const idx = await ask('Elige índice de wallet para recompensa: ');
        const addr = addrs[parseInt(idx)];
        if (!addr) {
          console.log('Inválido');
          continue;
        }
        blockchain.minePendingTransactions(addr);
        console.log(`Minado. Nuevo saldo: ${blockchain.getBalanceOfAddress(addr)}`);
      } else if (choice === '4') {
        if (wallets.size < 1) {
          console.log('Necesitas al menos una wallet.');
          continue;
        }
        const fromIdx = await ask('Wallet origen (número de la lista anterior o pega dirección): ');
        // Simplificado: pide dirección completa o índice
        let fromAddr = fromIdx;
        if (!isNaN(fromIdx) && wallets.size > parseInt(fromIdx)) {
          fromAddr = Array.from(wallets.keys())[parseInt(fromIdx)];
        }
        const wallet = wallets.get(fromAddr);
        if (!wallet) {
          console.log('Wallet no encontrada');
          continue;
        }
        const toAddr = await ask('Dirección destino: ');
        const amount = parseFloat(await ask('Cantidad: '));
        if (isNaN(amount) || amount <= 0) {
          console.log('Cantidad inválida');
          continue;
        }
        const tx = wallet.createTransaction(toAddr, amount);
        blockchain.addTransaction(tx);
        console.log('Transacción añadida al mempool. Mina un bloque para confirmarla.');
      } else if (choice === '5') {
        console.log(`Bloques: ${blockchain.chain.length}`);
        console.log(`¿Válida?: ${blockchain.isChainValid()}`);
        console.log(`Dificultad: ${blockchain.difficulty}`);
        console.log(`Pendientes: ${blockchain.pendingTransactions.length}`);
      } else if (choice === '6') {
        blockchain.saveChain();
        saveWallets();
        console.log('Guardado. ¡Hasta luego!');
        break;
      } else if (choice === '0') {
        console.log('Saliendo sin guardar.');
        break;
      } else {
        console.log('Opción no válida');
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  rl.close();
  console.log('\nFin de la Práctica 10. ¡Has completado el núcleo de JScoin Lab!');
  console.log('Recuerda: esto es solo un prototipo educativo.');
}

main().catch(console.error);
