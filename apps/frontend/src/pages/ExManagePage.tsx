import { useMemo, useState } from 'react';
import PageHeader from '../components/Header/PageHeader';
import ExhibitionList from '../components/exhibition/ExhibitionList';
import AddInline from '../components/AddInline/AddInline';
import { useExhibitions } from '../hook/useExhibitions';
import type { Exhibition } from '../types/exhibition';

/*
const SAMPLE: Exhibition[] = [
  {
            id: '1', title: 'SMART TECH EXPO 2025', description: 'งานแสดงเทคโนโลยีและนวัตกรรม',
            dateText: 'วันที่ 1–5 พ.ย. 2568 | เวลา 09:00–18:00 น.',
            location: 'Bangkok Convention Center',
            coverUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop',
            isPinned: true
      },
      {
            id: '2', title: 'SMART TECH EXPO 2025', description: 'งานแสดงเทคโนโลยีและนวัตกรรม',
            dateText: 'วันที่ 1–5 พ.ย. 2568 | เวลา 09:00–18:00 น.',
            location: 'Bangkok Convention Center',
            coverUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop'
      },
];

export default function ExhibitionPage() {
      const [query, setQuery] = useState('');
      const [items, setItems] = useState<Exhibition[]>(SAMPLE);

      const filtered = useMemo(() => {
            const q = query.trim().toLowerCase();
            if (!q) return items;
            return items.filter(x => [x.title, x.description, x.location].some(t => (t || '').toLowerCase().includes(q)));
      }, [items, query]);

      const addItem = () => {
            const n: Exhibition = {
                               id: crypto.randomUUID(), title: 'งานจัดแสดงโครงงานวิทยาศาสตร์',
                  description: 'ตัวอย่างที่เพิ่มใหม่', dateText: '12/01/2099 – 14/01/2099', location: 'สสว. ชุมพร'
            };
            setItems(s => [n, ...s]);
      };
*/

export default function ExhibitionPage() {
      const [query] = useState('');
      const { data, isLoading, isError } = useExhibitions();

      const items: Exhibition[] = useMemo(() => data ?? [], [data]);
      // const [items, setItems] = useState<Exhibition[]>(SAMPLE);

      const filtered = useMemo(() => {
            const q = query.trim().toLowerCase();
            if (!q) return items;
            return items.filter(x => [x.title, x.description, x.location].some(t => (t || '').toLowerCase().includes(q)));
      }, [items, query]);

      const handleAdd = () => {
            // TODO: integrate create exhibition API then call refetch()
      };

      return (
            <div>
                  <PageHeader title="จัดการงานนิทรรศการ" />
                  <div className="container">
                        <div className="cardWrap">
                              {isLoading && <div>Loading exhibitions...</div>}
                              {isError && <div>Failed to load exhibitions</div>}
                              {!isLoading && !isError && (
                                    <>
                                          <ExhibitionList items={filtered} />
                                          <AddInline onClick={handleAdd} />
                                    </>
                              )}
                        </div>
                  </div>
            </div>
      );
}
