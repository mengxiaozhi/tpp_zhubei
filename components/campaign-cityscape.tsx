type BuildingProps = {
  x: number;
  y: number;
  width: number;
  floors: number;
  columns: number;
  color: string;
  trim: string;
};

const buildings: BuildingProps[] = [
  { x: 0, y: 372, width: 163, floors: 5, columns: 5, color: "#ddc7b8", trim: "#cbb3a5" },
  { x: 200, y: 251, width: 246, floors: 8, columns: 6, color: "#cfb5ae", trim: "#b09997" },
  { x: 469, y: 365, width: 147, floors: 5, columns: 4, color: "#d8bdb0", trim: "#bda5a1" },
  { x: 651, y: 314, width: 230, floors: 6, columns: 5, color: "#c8aaa7", trim: "#a99092" },
  { x: 913, y: 382, width: 150, floors: 4, columns: 4, color: "#d1a99d", trim: "#bc968e" },
  { x: 1103, y: 248, width: 204, floors: 8, columns: 5, color: "#c4a298", trim: "#a9827d" },
  { x: 1330, y: 399, width: 131, floors: 4, columns: 3, color: "#d9b9a3", trim: "#bc9c94" },
];

const pedestrians = [
  { x: 1175, y: 608, scale: 0.75, coat: "#869eab" },
  { x: 117, y: 609, scale: 0.75, coat: "#b5b4c7" },
  { x: 337, y: 615, scale: 0.8, coat: "#c2c29c" },
  { x: 928, y: 615, scale: 0.72, coat: "#baabbd" },
  { x: 525, y: 619, scale: -0.7, coat: "#dfb7a0" },
  { x: 1392, y: 620, scale: 0.84, coat: "#85a9a4" },
  { x: 726, y: 621, scale: 0.78, coat: "#b1a3be" },
  { x: 859, y: 634, scale: -0.83, coat: "#73a4af" },
  { x: 1049, y: 634, scale: 0.94, coat: "#d5a88c" },
  { x: 589, y: 645, scale: 0.92, coat: "#ddb577" },
  { x: 213, y: 650, scale: -0.88, coat: "#e4b295" },
  { x: 961, y: 654, scale: -0.83, coat: "#87b3a2" },
  { x: 1282, y: 657, scale: -0.93, coat: "#d4a783" },
  { x: 651, y: 666, scale: -1.02, coat: "#a2b9c5" },
  { x: 459, y: 667, scale: 1.05, coat: "#91b6aa" },
  { x: 793, y: 676, scale: 1.06, coat: "#d69e8f" },
];

function Building({ x, y, width, floors, columns, color, trim }: BuildingProps) {
  const height = 553 - y;
  const columnWidth = (width - 28) / columns;
  const floorHeight = (height - 58) / floors;
  const windowColors = ["#ffe9bd", "#b2c3c4", "#e6d2bc", "#f4d8ad"];

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={width} height={height} fill={color} />
      <rect x={width - 18} width={18} height={height} fill={trim} opacity=".42" />
      <rect x={-3} y={-3} width={width + 6} height={9} rx={2} fill={trim} />
      {Array.from({ length: floors }, (_, floor) => (
        <g key={floor} transform={`translate(0 ${20 + floor * floorHeight})`}>
          {Array.from({ length: columns }, (_, column) => (
            <rect
              key={column}
              x={10 + column * columnWidth}
              width={columnWidth - 7}
              height={floorHeight - 9}
              rx={1.5}
              fill={windowColors[(column + 3 * floor + Math.round(x / 10)) % windowColors.length]}
            />
          ))}
          <path d={`M0 ${floorHeight - 5}h${width}`} stroke={trim} strokeOpacity=".26" />
        </g>
      ))}
      <rect x={0} y={height - 44} width={width} height={10} fill={trim} />
      <rect x={10} y={height - 33} width={width * 0.56} height={29} fill="#efd3ad" />
      <rect x={width * 0.68} y={height - 33} width={width * 0.22} height={33} fill="#aa8e84" opacity=".65" />
    </g>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M39 77C16 77 0 65 0 49s13-26 34-26c9-17 29-25 46-18 12-21 48-26 65-5 15-4 32 3 40 15 22-1 40 10 40 28 0 20-21 35-45 35Z"
      fill="#fff7e9"
      opacity=".66"
    />
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy={24} rx={28} ry={5} fill="#8f817a" opacity=".21" />
      <path d="M-5 22V-61h10v83a5 5 0 0 1-10 0Z" fill="#a78c73" />
      <path d="m1-34-26-25M1-42l23-22" fill="none" stroke="#a78c73" strokeWidth={6} strokeLinecap="round" />
      <path
        d="M-58-75c-7-21 9-39 27-41 9-17 33-23 49-14 17-6 39 2 46 20 17 8 22 28 14 44-10 19-27 27-47 24-18 13-40 10-54-3-19 3-35-9-35-30Z"
        fill="#83a98c"
      />
      <g fill="#a9c49a" opacity=".84">
        <circle cx={-31} cy={-91} r={21} />
        <circle cx={-1} cy={-108} r={19} />
        <circle cx={32} cy={-105} r={23} />
        <circle cx={54} cy={-78} r={18} />
        <circle cx={8} cy={-71} r={24} />
      </g>
    </g>
  );
}

function Pedestrian({ x, y, scale, coat }: (typeof pedestrians)[number]) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale} ${Math.abs(scale)})`}>
      <ellipse rx={17} ry={3.5} fill="#9b8176" opacity=".24" />
      <path d="m-4-24-3 14-6 8m16-22 4 13 7 8" fill="none" stroke="#737079" strokeWidth={6} strokeLinecap="round" />
      <rect x={-11} y={-52} width={22} height={34} rx={9} fill={coat} />
      <circle cy={-63} r={11} fill="#efd0ad" />
      <path d="M-11-64a11 11 0 0 1 22 0Z" fill="#797074" />
    </g>
  );
}

function StreetLamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="#9f8c86" strokeLinecap="round">
      <path d="M0 0v-114a15 15 0 0 1 15-15h14" strokeWidth={5} />
      <path d="M20-130h21" strokeWidth={8} />
    </g>
  );
}

export function CampaignCityscape({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" className={className}>
      <Cloud x={-83} y={117} scale={0.96} />
      <Cloud x={704} y={131} scale={1.18} />
      <Cloud x={1243} y={172} scale={1.15} />

      <path
        d="M0 342h40v-18h82v16h61v-24h95v40h110v-32h39v-35h23v35h48v74h61v-59h66v14h91v35h83v-39h48v-40h35v-14h31v14h57v55h55v-35h42v10h39v-25h92v14h61v72h27v-68h100v-17h42v235H0Z"
        fill="#d7b8a9"
        opacity=".46"
      />
      <g stroke="#b39c9a" strokeWidth={2} opacity=".72">
        <path d="M325 252v-45M767 315v-40M1202 251v-34" />
        <path d="M394 252v-23M1146 252v-20" />
      </g>
      {buildings.map((building) => <Building key={building.x} {...building} />)}

      <path d="M0 552h1440v148H0Z" fill="#edddc9" />
      <path d="M0 551h1440v8H0Z" fill="#f7e8d6" />
      <path d="M0 559h1440M0 588h1440M0 623h1440M0 669h1440" stroke="#d4bca8" strokeOpacity=".62" />
      <path d="m250 560-70 140m284-140-45 140m281-140v140m255-140 46 140m207-140 74 140" stroke="#d4bca8" strokeOpacity=".4" />

      <StreetLamp x={183} y={567} />
      <StreetLamp x={702} y={570} />
      <StreetLamp x={1254} y={565} />
      <Tree x={46} y={556} scale={0.95} />
      <Tree x={521} y={563} scale={1.12} />
      <Tree x={907} y={556} scale={0.97} />
      <Tree x={1349} y={566} scale={1.15} />

      {pedestrians.map((pedestrian) => (
        <Pedestrian key={pedestrian.x} {...pedestrian} />
      ))}
    </svg>
  );
}
