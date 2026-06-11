import { Compass } from "lucide-react";
import type { RestaurantRecommendation } from "../api";
import { cn } from "../lib/utils";
import { MiniMascot } from "./Mascot";

export function RecommendationMessage({
  recommendations,
  compact = false,
}: {
  recommendations: RestaurantRecommendation[];
  compact?: boolean;
}) {
  if (!recommendations.length) return null;

  return (
    <div className="flex w-full">
      <div className={cn("flex max-w-[88%] gap-2.5", compact && "max-w-full")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <MiniMascot className="h-8 w-8 nyam-bob" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <span className="text-[11px] font-medium text-zinc-400">NyamBot</span>
          <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50 px-3.5 py-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard key={`${recommendation.restaurant.id}-${index}`} rec={recommendation} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: RestaurantRecommendation; rank: number }) {
  const restaurant = rec.restaurant;
  const description = buildRecommendationDescription(rec);
  const metaParts = [restaurant.area, restaurant.cuisine, restaurant.price_level].filter(Boolean);

  return (
    <div className="space-y-2">
      <article className="rounded-2xl border border-brand-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-zinc-900">{restaurant.name}</strong>
            <span className="text-xs text-zinc-500">{metaParts.join(" · ")}</span>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
            {rank}위
          </span>
        </div>
      </article>

      <p className="rounded-2xl bg-white px-3.5 py-2.5 text-sm leading-relaxed text-zinc-800">
        {description}
      </p>

      {restaurant.kakao_place_url && (
        <div className="flex justify-end">
          <a
            href={restaurant.kakao_place_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Compass size={12} />
            카카오맵으로 바로가기
          </a>
        </div>
      )}
    </div>
  );
}

function buildRecommendationDescription(rec: RestaurantRecommendation) {
  const evidence = rec.evidence[0]?.trim();
  const caution = rec.caution?.trim();
  const isExternalCandidate = rec.restaurant.id.startsWith("kakao-") || rec.restaurant.note_count === 0;
  const parts: string[] = [];

  if (evidence) {
    const cleanEvidence = evidence.replace(/[.!?。！？]+$/, "");
    parts.push(isExternalCandidate ? cleanEvidence : `${cleanEvidence}라는 기록이 있어.`);
  } else {
    parts.push(rec.reason.replace(/[.!?。！？]+$/, ""));
  }

  if (caution && !isExternalCandidate) {
    parts.push(caution.replace(/[.!?。！？]+$/, ""));
  }

  return parts.join(" ");
}
