import { useMemo, useState } from "react";
import useMediaQuery from "../hook/useMediaQuery";

// มือถือ
import PageHeader from "../components/PageHeader/PageHeader";
import ExhibitionList from "../components/exhibition/ExhibitionList";
import AddInline from "../components/AddInline/AddInline";

// เดสก์ท็อป
import HeaderBar from "../components/Desktop_HeaderBar/HeaderBar";
import Panel from "../components/Panel/Panel";

import { useExhibitions } from "../hook/useExhibitions";
import type { Exhibition } from "../types/exhibition";
import { useNavigate } from "react-router-dom";

// const SAMPLE: Exhibition[] = [
//   {
//     id: '1',
//     title: 'SMART TECH EXPO 2025',
//     description: 'งานแสดงเทคโนโลยีและนวัตกรรม',
//     dateText: 'วันที่ 1–5 พ.ย. 2568 | เวลา 09:00–18:00 น.',
//     location: 'Bangkok Convention Center',
//     coverUrl:
//       'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop',
//     isPinned: true,
//   },
//   {
//     id: '2',
//     title: 'SMART TECH EXPO 2025',
//     description: 'งานแสดงเทคโนโลยีและนวัตกรรม',
//     dateText: 'วันที่ 1–5 พ.ย. 2568 | เวลา 09:00–18:00 น.',
//     location: 'Bangkok Convention Center',
//     coverUrl:
//       'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop',
//   },
// ];

// export default function ExhibitionPage() {

//   // const [items, setItems] = useState<Exhibition[]>(SAMPLE);

//   const filtered = useMemo(() => items, [items]);

//       const addItem = () => {
//             const n: Exhibition = {
//                                id: crypto.randomUUID(), title: 'งานจัดแสดงโครงงานวิทยาศาสตร์',
//                   description: 'ตัวอย่างที่เพิ่มใหม่', dateText: '12/01/2099 – 14/01/2099', location: 'สสว. ชุมพร'
//             };
//             setItems(s => [n, ...s]);
//       };

export default function ExhibitionPage() {
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [query] = useState("");
  const { data, isLoading, isError } = useExhibitions();
  const navigate = useNavigate();
  const items: Exhibition[] = useMemo(() => data ?? [], [data]);
  // const [items, setItems] = useState<Exhibition[]>(SAMPLE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [x.title, x.description, x.location].some((t) =>
        (t || "").toLowerCase().includes(q)
      )
    );
  }, [items, query]);

  const handleAdd = () => {
    navigate("/exhibitions/new");
  };

  const handleSelect = (id: string) => {
    navigate(`/exhibitions/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/exhibitions/${id}/edit`);
  };
  if (!isDesktop) {
    return (
      <div>
        <PageHeader title="จัดการงานนิทรรศการ" />
        <div className="container">
          <div className="cardWrap">
            {isLoading && <div>Loading exhibitions...</div>}
            {isError && <div>Failed to load exhibitions</div>}
            {!isLoading && !isError && (
              <>
                <ExhibitionList
                  items={filtered}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                />
                <AddInline onClick={handleAdd} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // เดสก์ท็อป
  return (
    <div>
      <HeaderBar
        active="exhibition"
        onLoginClick={() => console.log("login")}
      />
      <Panel title="จัดการงานนิทรรศการ">
        <ExhibitionList
          items={filtered}
          onSelect={handleSelect}
          onEdit={handleEdit}
        />
      </Panel>
    </div>
  );
}

//  return (
//       <div>
//         <PageHeader title="จัดการงานนิทรรศการ" />
//         <div className="container">
//           <div className="cardWrap">
// {
//   isLoading && <div>Loading exhibitions...</div>;
// }
// {
//   isError && <div>Failed to load exhibitions</div>;
// }
// {
//   !isLoading && !isError && (
//     <>
//       <ExhibitionList
//         items={filtered}
//         onSelect={handleSelect}
//         onEdit={handleEdit}
//       />
//       <AddInline onClick={handleAdd} />
//     </>
//   );
// }
//           </div>
//         </div>
//       </div>
//     );
