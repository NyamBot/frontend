/** 쉼표로 구분된 문자열을 trim + 빈 값 제거한 배열로 변환 */
export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 여러 줄 답변에서 첫 비어있지 않은 줄만 추출 (요약 표시용) */
export function compactAnswer(value: string): string {
  return value.split("\n").find((line) => line.trim()) ?? value;
}

/** 카카오 주소에서 대략적인 지역명 추출 (예: "서울 성동구 ..." → "성동구") */
export function extractArea(address: string): string {
  const parts = address.split(" ").filter(Boolean);
  return parts[1] ?? parts[0] ?? "";
}

/** 카카오 카테고리("음식점 > 일식 > 초밥")에서 마지막 세부 분류 추출 */
export function extractCuisine(category: string): string {
  const parts = category
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? "음식점";
}

/** className 조건부 결합 (clsx 경량 대체) */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
