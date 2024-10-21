import { useState, useEffect } from "react";

interface Compra {
  id: number;
  descricao: string;
  valor: number;
  compartilhada: boolean;
  pessoas: string[];
  pagos: { [pessoa: string]: boolean };
  proprietario: string;
  parcelado: boolean;
  parcelas: number;
}

const App = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [novaCompra, setNovaCompra] = useState({
    descricao: "",
    valor: 0,
    compartilhada: false,
    pessoas: "",
    proprietario: "",
    parcelado: false,
    parcelas: 1,
  });
  const [filtroProprietario, setFiltroProprietario] = useState("");
  const [filtroPago, setFiltroPago] = useState<"all" | "paid" | "unpaid">("all");

  // Load data from localStorage when the component mounts
  useEffect(() => {
    const savedData = localStorage.getItem("faturas");
    if (savedData) {
      setCompras(JSON.parse(savedData));
    }
  }, []);

  // Save data to localStorage whenever the compras state changes
  useEffect(() => {
    localStorage.setItem("faturas", JSON.stringify(compras));
  }, [compras]);

  const adicionarCompra = () => {
    let pessoasArray: string[] = [];

    if (novaCompra.compartilhada) {
      pessoasArray = novaCompra.pessoas.split(",").map(p => p.trim());
    }

    if (!pessoasArray.includes(novaCompra.proprietario)) {
      pessoasArray.push(novaCompra.proprietario);
    }

    const valorPorParcela = novaCompra.parcelado ? novaCompra.valor / novaCompra.parcelas : novaCompra.valor;

    const newCompra: Compra = {
      id: compras.length + 1,
      descricao: novaCompra.descricao,
      valor: valorPorParcela,
      compartilhada: novaCompra.compartilhada,
      pessoas: pessoasArray,
      pagos: pessoasArray.reduce((acc, pessoa) => {
        acc[pessoa] = false;
        return acc;
      }, {} as { [pessoa: string]: boolean }),
      proprietario: novaCompra.proprietario,
      parcelado: novaCompra.parcelado,
      parcelas: novaCompra.parcelas,
    };

    setCompras([...compras, newCompra]);
    setNovaCompra({
      descricao: "",
      valor: 0,
      compartilhada: false,
      pessoas: "",
      proprietario: "",
      parcelado: false,
      parcelas: 1,
    });
  };

  const marcarPagamento = (compraId: number, pessoa: string) => {
    setCompras(compras.map(compra => {
      if (compra.id === compraId) {
        return {
          ...compra,
          pagos: {
            ...compra.pagos,
            [pessoa]: !compra.pagos[pessoa]
          }
        };
      }
      return compra;
    }));
  };

  const downloadData = () => {
    const dataStr = JSON.stringify(compras, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faturas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          const parsedData = JSON.parse(result as string);
          setCompras(parsedData);
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredCompras = compras.filter(compra => {
    const allPaid = Object.values(compra.pagos).every(pago => pago);
    const matchesProprietario = filtroProprietario === "" || compra.proprietario.includes(filtroProprietario);
    const matchesPago = filtroPago === "all" || (filtroPago === "paid" && allPaid) || (filtroPago === "unpaid" && !allPaid);
    return matchesProprietario && matchesPago;
  });

  const totalSum = filteredCompras.reduce((sum, compra) => {
    const allPaid = Object.values(compra.pagos).every(pago => pago);
    return allPaid ? sum : sum + compra.valor;
  }, 0);

  return (
    <div className="container mx-auto p-4">
      <nav className="bg-gray-800 p-4 flex justify-between items-center mb-4">
        <div className="text-white text-lg">Gerenciador de Faturas</div>
        <div>
          <button onClick={downloadData} className="bg-green-500 text-white p-2 mr-2">Download Data</button>
          <input type="file" accept=".json" onChange={uploadData} className="bg-blue-500 text-white p-2" />
        </div>
      </nav>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Descrição"
          value={novaCompra.descricao}
          onChange={(e) =>
            setNovaCompra({ ...novaCompra, descricao: e.target.value })
          }
          className="border p-2 mr-2"
        />
        <input
          type="number"
          placeholder="Valor"
          value={novaCompra.valor}
          onChange={(e) => setNovaCompra({ ...novaCompra, valor: parseFloat(e.target.value) })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Proprietário Principal"
          value={novaCompra.proprietario}
          onChange={(e) =>
            setNovaCompra({ ...novaCompra, proprietario: e.target.value })
          }
          className="border p-2 mr-2"
        />
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={novaCompra.compartilhada}
            onChange={(e) =>
              setNovaCompra({ ...novaCompra, compartilhada: e.target.checked })
            }
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="ml-2">Compartilhada</span>
        </label>
        {novaCompra.compartilhada && (
          <input
            type="text"
            placeholder="Pessoas (separadas por vírgula)"
            value={novaCompra.pessoas}
            onChange={(e) =>
              setNovaCompra({ ...novaCompra, pessoas: e.target.value })
            }
            className="border p-2 ml-2"
          />
        )}
        <label className="inline-flex items-center ml-4">
          <input
            type="checkbox"
            checked={novaCompra.parcelado}
            onChange={(e) =>
              setNovaCompra({ ...novaCompra, parcelado: e.target.checked })
            }
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="ml-2">Parcelada</span>
        </label>
        {novaCompra.parcelado && (
          <input
            type="number"
            placeholder="Quantidade de Meses"
            value={novaCompra.parcelas}
            onChange={(e) =>
              setNovaCompra({ ...novaCompra, parcelas: parseInt(e.target.value) })
            }
            className="border p-2 ml-2"
          />
        )}
        <button onClick={adicionarCompra} className="bg-blue-500 text-white p-2 ml-2">Adicionar Compra</button>
      </div>
      <hr className="my-4" />
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Filtrar por Proprietário"
          value={filtroProprietario}
          onChange={(e) => setFiltroProprietario(e.target.value)}
          className="border p-2 mr-2"
        />
        <select
          value={filtroPago}
          onChange={(e) => setFiltroPago(e.target.value as "all" | "paid" | "unpaid")}
          className="border p-2"
        >
          <option value="all">Todos</option>
          <option value="paid">Pagos</option>
          <option value="unpaid">Não Pagos</option>
        </select>
      </div>
      <h2 className="text-2xl font-bold mb-4">Compras</h2>
      <ul>
        {filteredCompras.map((compra) => {
          const allPaid = Object.values(compra.pagos).every(pago => pago);
          return (
            <li key={compra.id} className={`mb-4 p-4 border rounded ${allPaid ? 'bg-green-100' : 'bg-white'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{compra.descricao}</h3>
                <span className="text-lg font-medium">R${compra.valor}</span>
              </div>
              <div className="mt-2">
                {compra.pessoas.map((pessoa) => (
                  <div key={pessoa} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={compra.pagos[pessoa]}
                      onChange={() => marcarPagamento(compra.id, pessoa)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2">{pessoa} - R${compra.compartilhada ? (compra.valor / compra.pessoas.length).toFixed(2) : compra.valor.toFixed(2)} {compra.pagos[pessoa] ? "(Pago)" : "(Não Pago)"}</span>
                  </div>
                ))}
                {compra.parcelado && (
                  <div className="mt-2 text-sm text-gray-600">
                    Parcelado em {compra.parcelas} meses
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 p-4 border-t">
        <h3 className="text-xl font-semibold">Total: R${totalSum.toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default App;