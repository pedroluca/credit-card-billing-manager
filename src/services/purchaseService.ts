import { readFile, writeFile } from 'fs'; // Apenas se estiver rodando em um ambiente que suporte fs

interface Purchase {
  description: string;
  totalValue: number;
  sharedWith: string[];
  paidBy: { [key: string]: boolean };
  installments: {
    totalInstallments: number;
    currentInstallment: number;
    installmentValue: number;
  };
  date: string;
}

let purchases: Purchase[] = [];
let closingDate = "";
let dueDate = "";

// Função para adicionar uma compra
export function addPurchase(
  description: string,
  totalValue: number,
  sharedWith: string[],
  installments: number = 1
) {
  const purchase = {
    description,
    totalValue,
    sharedWith: ["Pedro", ...sharedWith], // "Pedro" é adicionado por padrão
    paidBy: sharedWith.reduce<{ [key: string]: boolean }>((acc, person) => {
      acc[person] = false;
      return acc;
    }, { Pedro: false }),
    installments: {
      totalInstallments: installments,
      currentInstallment: 1,
      installmentValue: totalValue / installments,
    },
    date: new Date().toISOString().split("T")[0] // Data atual
  };

  purchases.push(purchase);
  saveToJSON();
}

// Função para atualizar parcelas automaticamente em novas faturas
export function updateInstallments() {
  purchases.forEach(purchase => {
    if (purchase.installments && purchase.installments.currentInstallment < purchase.installments.totalInstallments) {
      purchase.installments.currentInstallment++;
      purchases.push({
        ...purchase,
        date: new Date().toISOString().split("T")[0], // Atualiza a data
        description: `${purchase.description} (Parcela ${purchase.installments.currentInstallment}/${purchase.installments.totalInstallments})`
      });
    }
  });
  saveToJSON();
}

// Função para carregar compras do arquivo
export function loadPurchases() {
  readFile("data.json", "utf8", (err, data) => {
    if (err) throw err;
    const loadedData = JSON.parse(data);
    closingDate = loadedData.billingSettings.closingDate;
    dueDate = loadedData.billingSettings.dueDate;
    purchases = loadedData.purchases;
  });
}

// Função para salvar as compras no arquivo
function saveToJSON() {
  const data = {
    billingSettings: { closingDate, dueDate },
    purchases
  };

  writeFile("data.json", JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
  });
}
