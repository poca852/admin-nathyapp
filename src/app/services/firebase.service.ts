import { Injectable, inject } from '@angular/core';
import { Storage, getStorage, ref, getDownloadURL, uploadString, deleteObject } from '@angular/fire/storage';

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
  
}
