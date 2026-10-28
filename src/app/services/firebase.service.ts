import { Injectable, inject } from '@angular/core';
import { Storage, getStorage, ref, getDownloadURL, uploadString, deleteObject } from '@angular/fire/storage';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private readonly storage = inject(Storage);

  async uploadImage(path: string, data_url: string) {
    return uploadString(ref(getStorage(), path), data_url, 'data_url').then(() => {
      return getDownloadURL(ref(getStorage(), path))
    })
  }

  /** Borra archivos que ya no apunta ningún cliente. Ignora los que no existen. */
  async deleteByUrls(urls: Array<string | null | undefined>): Promise<void> {
    const unicas = [...new Set(urls.filter((url): url is string => this.esArchivoDelProyecto(url)))];
    await Promise.all(unicas.map((url) => this.deleteByUrl(url)));
  }

  private esArchivoDelProyecto(url: string | null | undefined): url is string {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'firebasestorage.googleapis.com') {
        return false;
      }
      const path = decodeURIComponent(parsed.pathname);
      const bucket = environment.firebase.storageBucket;
      if (bucket && !path.includes(`/b/${bucket}/`)) return false;
      return path.includes('/clientes/');
    } catch {
      return false;
    }
  }

  private async deleteByUrl(url: string): Promise<void> {
    try {
      await deleteObject(ref(getStorage(), url));
    } catch (error: any) {
      if (error?.code === 'storage/object-not-found') return;
      console.error('No se pudo borrar la foto huérfana', error);
    }
  }
}
