import { ImageResponse } from "next/og";

/** Иконка приложения: столбики графика на тёмном стекле, один — акцентного цвета. */
export function renderAppIcon(size: number) {
  const bar = Math.round(size * 0.1);
  const bars: [string, number][] = [
    ["rgba(255,255,255,0.45)", 0.34],
    ["#ff3b5f", 0.62],
    ["rgba(255,255,255,0.45)", 0.24],
    ["rgba(255,255,255,0.45)", 0.46],
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(150deg, #2e353b, #111417)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: bar * 0.7,
          paddingBottom: size * 0.24,
        }}
      >
        {bars.map(([color, h], i) => (
          <div key={i} style={{ display: "flex", width: bar, height: size * h, background: color, borderRadius: bar }} />
        ))}
      </div>
    ),
    { width: size, height: size },
  );
}
