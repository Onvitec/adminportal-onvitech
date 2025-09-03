import { Solution } from "@/lib/types";

export function SolutionDisplay({ solution }: { solution: Solution | null }) {
  if (!solution) return null;

  return (
    <div className="relative flex-1 bg-black rounded-xl flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-3xl w-full mx-4 shadow-xl border border-white/30">
        <h2 className="text-2xl font-bold text-white mb-4">Solution</h2>

        {/* Form Solution */}
        {solution.category_id === 1 && solution.form_data && (
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">Form Solution</h3>
            <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(solution.form_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Email Solution */}
        {solution.category_id === 2 && solution.emailContent && (
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">Email Solution</h3>
            <p className="whitespace-pre-line">{solution.emailContent}</p>
          </div>
        )}

        {/* Link Solution */}
        {solution.category_id === 3 && solution.link_url && (
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">Link Solution</h3>
            <a
              href={solution.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              {solution.link_url}
            </a>
          </div>
        )}

        {/* Video Solution */}
        {solution.category_id === 4 && solution.video_url && (
          <div className="mt-4">
            <video
              src={solution.video_url}
              controls
              className="w-full rounded-lg border border-white/40"
            />
          </div>
        )}
      </div>
    </div>
  );
}