'use client';

export function PrizeExplanation() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-3">How Prize Stakes Work</h3>

          <div className="space-y-4 text-sm">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
              <p className="font-semibold text-green-700 mb-2">✅ If You COMPLETE the Challenge:</p>
              <p className="text-gray-700">
                You <span className="font-bold">WIN BACK 100%</span> of your stake! The full amount is returned to you as a reward for your commitment and success.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
              <p className="font-semibold text-red-700 mb-2">❌ If You FAIL the Challenge:</p>
              <p className="text-gray-700 mb-3">
                You <span className="font-bold">LOSE</span> your stake. The money will go to the consequence you choose below. This creates real accountability.
              </p>
              <p className="text-xs text-gray-600 italic">
                "Failure" means not completing all required activities within the challenge period, or having activities rejected by your accountability partner.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-xs text-amber-900">
              <span className="font-semibold">💡 Tip:</span> Studies show that financial commitment increases success rates by up to 3x. Choose an amount that motivates you but won't cause financial hardship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
