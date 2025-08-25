import { useBalance } from "gill-react";

export function TestComponent() {
  const { balance } = useBalance({
    address: "2E55VTGDCEGGurLicUDjhcsBeHU3umxKKCWp9d7mNm6W",
  });
  console.log(balance);
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Gill React Hooks Test
      </h2>
      <div className="font-mono text-sm text-gray-600">
        Balance: {balance ? `${balance.toLocaleString()} lamports` : "Loading..."}
      </div>
    </div>
  );
}
