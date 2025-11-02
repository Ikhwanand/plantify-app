import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { AUTH_STORAGE_KEY } from "./auth";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const resolveAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) ?? null;
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return typeof parsed?.accessToken === "string" ? parsed.accessToken : null;
  } catch {
    return null;
  }
};

const apiClient: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export type ScanResponse = {
  scanId: string;
  checklist: string[];
  previewUrl?: string | null;
  notes?: string | null;
  plantName?: string | null;
  analysisSummary?: string | null;
  confidence?: number | null;
  suggestedIssues?: string[] | null;
};

export type ChecklistPayload = {
  scanId: number;
  confirmedSymptoms: string[];
  deniedSymptoms: string[];
};

export type ChecklistResponse = {
  diagnosisId: number;
};

export type ChecklistItem = {
  symptom: string;
  aiDetected: boolean;
  userConfirmed: boolean;
  note?: string | null;
};

export type Recommendation = {
  type: "non_chemical" | "active_ingredient";
  title: string;
  description: string;
  caution?: string | null;
  references: number[];
};

export type Source = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string | null;
  summary: string;
};

export type AdditionalRequest = {
  type: "need_more_images" | "safe_action" | "monitoring" | "escalation";
  message: string;
};

export type ApiMessage = {
  message: string;
  status: number;
};

export type Diagnosis = {
  id: number;
  plantName?: string | null;
  issue: string;
  summary?: string | null;
  plantPart?: string | null;
  confidence: number;
  consensusScore?: number | null;
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  sources: Source[];
  additionalRequests: AdditionalRequest[];
  followUpQuestions: string[];
  createdAt: string;
};

export type DiagnosisHistoryItem = {
  id: number;
  plantName?: string | null;
  createdAt: string;
  issue: string;
  confidence: number;
};

export type LogEntry = {
  id: number;
  title: string;
  note: string;
  performedAt: string;
  category: "watering" | "fertilizing" | "treatment" | "observation" | "other";
};

export type Reminder = {
  id: number;
  title: string;
  scheduledFor: string;
  description?: string | null;
  frequency?: "once" | "weekly" | "monthly";
};

export type CommunityPost = {
  id: number;
  author: string;
  authorId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  tags: string[];
  isOwner: boolean;
};

export type CommunityComment = {
  id: number;
  postId: number;
  parentId?: number | null;
  author: string;
  authorId: number;
  body: string;
  createdAt: string;
  isOwner: boolean;
  replies?: CommunityComment[];
};

export type GalleryCase = {
  id: string;
  title: string;
  summary: string;
  crop: string;
  issue: string;
  imageUrl?: string;
  region?: string;
};

apiClient.interceptors.request.use((config) => {
  const token = resolveAccessToken();
  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export type DashboardMetric = {
  label: string;
  value: string | number;
  delta?: number;
};

export type UserSettings = {
  language: string;
  country: string;
  enableScientificMode: boolean;
  offlineMode: boolean;
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  language: "id",
  country: "ID",
  enableScientificMode: false,
  offlineMode: false,
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

export const uploadPlantImage = async (
  data: FormData,
  config?: AxiosRequestConfig
): Promise<ScanResponse> => {
  const response = await apiClient.post<ScanResponse>("/vision/scan", data, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });
  return response.data;
};

export const submitChecklist = async (
  payload: ChecklistPayload,
  config?: AxiosRequestConfig
): Promise<ChecklistResponse> => {
  const response = await apiClient.post<ChecklistResponse>("/diagnosis/checklist", payload, config);
  return response.data;
};

export const fetchScanChecklist = async (scanId: string, config?: AxiosRequestConfig): Promise<ScanResponse> => {
  const response = await apiClient.get<ScanResponse>(`/vision/scan/${scanId}`, config);
  return response.data;
};

export const fetchDiagnosis = async (id: string, config?: AxiosRequestConfig): Promise<Diagnosis> => {
  const response = await apiClient.get<Diagnosis>(`/diagnosis/${id}`, config);
  return response.data;
};

export const fetchDiagnosisHistory = async (
  config?: AxiosRequestConfig
): Promise<DiagnosisHistoryItem[]> => {
  const response = await apiClient.get<DiagnosisHistoryItem[]>("/diagnosis", config);
  return response.data;
};

export const deleteDiagnosis = async (id: number, config?: AxiosRequestConfig): Promise<ApiMessage> => {
  const response = await apiClient.delete<ApiMessage>(`/diagnosis/${id}`, config);
  return response.data;
};

export const fetchLogEntries = async (config?: AxiosRequestConfig): Promise<LogEntry[]> => {
  const response = await apiClient.get<LogEntry[]>("/logs/", config);
  return response.data;
};

export const createLogEntry = async (
  payload: Omit<LogEntry, "id">,
  config?: AxiosRequestConfig
): Promise<LogEntry> => {
  const response = await apiClient.post<LogEntry>("/logs/", payload, config);
  return response.data;
};

export const updateLogEntry = async (
  logId: number,
  payload: Partial<Omit<LogEntry, "id">>,
  config?: AxiosRequestConfig
): Promise<LogEntry> => {
  const response = await apiClient.patch<LogEntry>(`/logs/${logId}`, payload, config);
  return response.data;
};

export const deleteLogEntry = async (logId: number, config?: AxiosRequestConfig): Promise<ApiMessage> => {
  const response = await apiClient.delete<ApiMessage>(`/logs/${logId}`, config);
  return response.data;
};

export const fetchReminders = async (config?: AxiosRequestConfig): Promise<Reminder[]> => {
  try {
    const response = await apiClient.get<Reminder[]>("/reminders/", config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        console.warn("Endpoint reminder belum tersedia. Mengembalikan daftar kosong.");
        return [];
      }
      if (status === 401) {
        console.warn("Akses reminder memerlukan sesi login yang valid. Mengembalikan daftar kosong.");
        return [];
      }
      if (status && status >= 500) {
        throw error;
      }
    }
    throw error;
  }
};

export const createReminder = async (
  payload: Omit<Reminder, "id">,
  config?: AxiosRequestConfig
): Promise<Reminder> => {
  const response = await apiClient.post<Reminder>("/reminders/", payload, config);
  return response.data;
};

export const deleteReminder = async (reminderId: number, config?: AxiosRequestConfig): Promise<ApiMessage> => {
  const response = await apiClient.delete<ApiMessage>(`/reminders/${reminderId}`, config);
  return response.data;
};

export const updateReminder = async (
  reminderId: number,
  payload: Partial<Omit<Reminder, "id">>,
  config?: AxiosRequestConfig
): Promise<Reminder> => {
  const response = await apiClient.patch<Reminder>(`/reminders/${reminderId}`, payload, config);
  return response.data;
};

export const fetchCommunityPosts = async (
  config?: AxiosRequestConfig
): Promise<CommunityPost[]> => {
  const response = await apiClient.get<CommunityPost[]>("/community/posts", config);
  return response.data;
};

export const createCommunityPost = async (
  payload: { title: string; body: string; tags: string[] },
  config?: AxiosRequestConfig
): Promise<CommunityPost> => {
  const response = await apiClient.post<CommunityPost>("/community/posts", payload, config);
  return response.data;
};

export const updateCommunityPost = async (
  postId: number,
  payload: Partial<{ title: string; body: string; tags: string[] }>,
  config?: AxiosRequestConfig
): Promise<CommunityPost> => {
  const response = await apiClient.patch<CommunityPost>(`/community/posts/${postId}`, payload, config);
  return response.data;
};

export const deleteCommunityPost = async (postId: number, config?: AxiosRequestConfig): Promise<ApiMessage> => {
  const response = await apiClient.delete<ApiMessage>(`/community/posts/${postId}`, config);
  return response.data;
};

export const toggleCommunityPostLike = async (
  postId: number,
  config?: AxiosRequestConfig
): Promise<{ liked: boolean; likes: number }> => {
  const response = await apiClient.post<{ liked: boolean; likes: number }>(
    `/community/posts/${postId}/like`,
    undefined,
    config
  );
  return response.data;
};

export const fetchCommunityComments = async (
  postId: number,
  config?: AxiosRequestConfig
): Promise<CommunityComment[]> => {
  const response = await apiClient.get<CommunityComment[]>(`/community/posts/${postId}/comments`, config);
  return response.data;
};

export const createCommunityComment = async (
  postId: number,
  payload: { body: string; parentId?: number | null },
  config?: AxiosRequestConfig
): Promise<CommunityComment> => {
  const response = await apiClient.post<CommunityComment>(
    `/community/posts/${postId}/comments`,
    payload,
    config
  );
  return response.data;
};

export const deleteCommunityComment = async (
  postId: number,
  commentId: number,
  config?: AxiosRequestConfig
): Promise<ApiMessage> => {
  const response = await apiClient.delete<ApiMessage>(`/community/posts/${postId}/comments/${commentId}`, config);
  return response.data;
};

export const fetchGalleryCases = async (config?: AxiosRequestConfig): Promise<GalleryCase[]> => {
  try {
    const response = await apiClient.get<GalleryCase[]>("/gallery/cases", config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn("Endpoint galeri belum tersedia. Menggunakan koleksi kosong.");
      return [];
    }
    throw error;
  }
};

export const fetchDashboardMetrics = async (
  config?: AxiosRequestConfig
): Promise<DashboardMetric[]> => {
  const response = await apiClient.get<DashboardMetric[]>("/dashboard/metrics", config);
  return response.data;
};

export const fetchUserSettings = async (
  config?: AxiosRequestConfig
): Promise<UserSettings> => {
  try {
    const response = await apiClient.get<UserSettings>("/settings", config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn("Endpoint pengaturan belum tersedia. Menggunakan nilai default.");
      return DEFAULT_USER_SETTINGS;
    }
    throw error;
  }
};

export const updateUserSettings = async (
  payload: Partial<UserSettings>,
  config?: AxiosRequestConfig
): Promise<UserSettings> => {
  try {
    const response = await apiClient.patch<UserSettings>("/settings", payload, config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn("Endpoint pengaturan belum tersedia. Mengabaikan perubahan sementara.");
      return { ...DEFAULT_USER_SETTINGS, ...payload };
    }
    throw error;
  }
};

export const registerAccount = async (
  payload: { name: string; email: string; password: string },
  config?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload, config);
  return response.data;
};

export const loginAccount = async (
  payload: { email: string; password: string },
  config?: AxiosRequestConfig
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload, config);
  return response.data;
};

export default apiClient;
