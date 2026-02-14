import type {
  CreateNewsPayload,
  NewsLists,
  UpdateNewsPayload,
} from "../types/news";
import api from "./client";
import liffClient from "./liffClient";

export async function getNewsLists(): Promise<NewsLists[]> {
  const res = await api.get<NewsLists[]>("/news");
  return res.data;
}

export async function getNewsByExhibitionId(
  exhibitionId: number,
): Promise<NewsLists[]> {
  const res = await api.get<NewsLists[]>(`/news/${exhibitionId}`);
  return res.data;
}

export async function createNews(
  data: CreateNewsPayload,
): Promise<{ message: string; id: number }> {
  const { file, ...rest } = data;
  const fd = new FormData();
  fd.append("exhibition_id", String(rest.exhibition_id));
  fd.append("topic", rest.topic);
  if (rest.description) fd.append("description", rest.description);
  fd.append("is_active", String(rest.is_active ?? 1));
  if (file) fd.append("image_url", file);

  const res = await api.post<{ message: string; id: number }>("/news", fd);
  return res.data;
}

export async function updateNews(
  id: number,
  data: UpdateNewsPayload,
): Promise<{ message: string }> {
  const { file, ...rest } = data;
  const fd = new FormData();
  if (rest.exhibition_id !== undefined)
    fd.append("exhibition_id", String(rest.exhibition_id));
  if (rest.topic !== undefined) fd.append("topic", rest.topic);
  if (rest.description !== undefined)
    fd.append("description", rest.description ?? "");
  if (rest.is_active !== undefined)
    fd.append("is_active", String(rest.is_active));
  if (file) fd.append("image_url", file);

  const res = await api.patch<{ message: string }>(`/news/${id}`, fd);
  return res.data;
}

export async function deleteNews(id: number): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/news/${id}`);
  return res.data;
}

export async function getNewsByExhibitionIdLiff(
  exhibitionId: number,
): Promise<NewsLists[]> {
  const res = await liffClient.get<NewsLists[]>(`/news/${exhibitionId}`);
  return res.data;
}
