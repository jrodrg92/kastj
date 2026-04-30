import toast from "react-hot-toast";

type Props = {
  title: string;
  description: string;
  recipient: string;
  goal: string;
  duration: string;
  loading: boolean;
  connected: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onCreate: () => Promise<void>;
};

export function CreateProposalForm({
  title,
  description,
  recipient,
  goal,
  duration,
  loading,
  connected,
  onTitleChange,
  onDescriptionChange,
  onRecipientChange,
  onGoalChange,
  onDurationChange,
  onCreate,
}: Props) {
  async function handleSubmit() {
    if (!connected) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    await onCreate();
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Crear propuesta</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Define título, descripción, destinatario, objetivo y plazo máximo.
          </p>
        </div>

        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
          MVP Local
        </span>
      </div>

      <div className="space-y-4">
        <input
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
          placeholder="Título de la propuesta"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />

        <textarea
          className="min-h-28 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
          placeholder="Descripción detallada"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />

        <input
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
          placeholder="Wallet destinataria 0x..."
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
            placeholder="Objetivo en ETH fake"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 outline-none transition focus:border-green-500"
            placeholder="Duración en segundos"
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
          Reparto en éxito:{" "}
          <span className="text-white">93% destinatario</span> ·{" "}
          <span className="text-white">5% creador</span> ·{" "}
          <span className="text-white">2% treasury</span>
        </div>

        <button
          disabled={!connected || loading}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-black transition hover:bg-green-400 disabled:opacity-40 md:w-auto"
        >
          {loading ? "Creando..." : "Crear propuesta"}
        </button>
      </div>
    </section>
  );
}