import EmployeeQRCheckin from "../booking/EmployeeQRCheckin";

export default function EmployeeQRCheckinPage() {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-red-600">QR Check-in</span>
          </h1>
        </div>

        {/* Embed the real QR scanner component */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <EmployeeQRCheckin />
        </div>
      </div>
    </div>
  );
}
