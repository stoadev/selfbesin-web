import { useState } from "react";
import { foodService } from "../../services/food.service";
import Button from "./Button";
import Modal from "./Modal";

type AdminAddFoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminAddFoodModal({
  isOpen,
  onClose,
}: AdminAddFoodModalProps) {
  const [query, setQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsFetching(true);
    try {
      const added = await foodService.fetchAndLoadFood(query.trim());
      if (added > 0) {
        setSuccessMsg(
          `${added} besin bulundu ve incelemeye alındı. Onaylandıktan sonra aramada görünecek.`,
        );
        setQuery("");
      } else {
        setErrorMsg("İnternetten sonuç bulunamadı.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIsFetching(false);
    }
  };

  const isDisabled = query.trim().length < 3 || isFetching;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Besin Ekle
        </h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isDisabled) handleSubmit();
          }}
          placeholder="Besin adı..."
          className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2.5 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 dark:text-gray-200 transition-all mb-4"
        />
        <Button
          variant="primary"
          size="md"
          disabled={isDisabled}
          loading={isFetching}
          onClick={handleSubmit}
          className="w-full"
        >
          Ara ve Ekle
        </Button>
        {errorMsg && (
          <p className="mt-3 text-sm text-red-500">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="mt-3 text-sm text-green-600">{successMsg}</p>
        )}
      </div>
    </Modal>
  );
}
