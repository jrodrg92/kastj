const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
        const contract = new ethers.Contract(
            process.env.MANAGER_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            ['function proposalCount() view returns (uint256)'],
            provider
        );
        
        console.log("Conectando a:", await provider.getNetwork().then(n => n.name).catch(() => "Localhost"));
        const count = await contract.proposalCount();
        console.log('-----------------------------------');
        console.log('CONTADOR REAL EN BLOCKCHAIN:', count.toString());
        console.log('-----------------------------------');
        
        if (count == 0) {
            console.log("¡AVISO!: El contrato está vacío. ¿Has reiniciado el nodo?");
        }
    } catch (e) {
        console.error('ERROR AL CONECTAR:', e.message);
    }
}

check();
