package com.smartcrop.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@ExtendWith(MockitoExtension.class)
class FirestoreCollectionServiceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private com.google.cloud.firestore.CollectionReference buyersCollection;

    @Mock
    private DocumentReference savedDocumentRef;

    @Mock
    private QuerySnapshot querySnapshot;

    @Mock
    private QueryDocumentSnapshot documentOne;

    @Mock
    private QueryDocumentSnapshot documentTwo;

    @Test
    void createDocumentSavesAllowedCollection() throws Exception {
        FirestoreCollectionService service = new FirestoreCollectionService(firestore);
        Map<String, Object> payload = Map.of(
            "full_name", "Buyer One",
            "phone_number", "0771111111",
            "email", "buyer1@gmail.com"
        );

        when(firestore.collection("buyers")).thenReturn(buyersCollection);
        when(buyersCollection.add(anyMap())).thenReturn(ApiFutures.immediateFuture(savedDocumentRef));
        when(savedDocumentRef.getId()).thenReturn("buyer-doc-1");

        Map<String, String> result = service.createDocument("buyers", payload);

        assertThat(result).containsEntry("id", "buyer-doc-1");
        assertThat(result).containsEntry("collectionName", "buyers");

        ArgumentCaptor<Map<String, Object>> documentCaptor = ArgumentCaptor.forClass(Map.class);
        verify(buyersCollection).add(documentCaptor.capture());
        assertThat(documentCaptor.getValue())
            .containsEntry("collection_name", "buyers")
            .containsEntry("full_name", "Buyer One")
            .containsKey("created_at");
    }

    @Test
    void getDocumentsReturnsCollectionDocuments() throws Exception {
        FirestoreCollectionService service = new FirestoreCollectionService(firestore);

        when(firestore.collection("buyers")).thenReturn(buyersCollection);
        when(buyersCollection.get()).thenReturn(ApiFutures.immediateFuture(querySnapshot));
        when(querySnapshot.getDocuments()).thenReturn(List.of(documentOne, documentTwo));
        when(documentOne.getData()).thenReturn(Map.of("full_name", "Buyer One"));
        when(documentOne.getId()).thenReturn("buyer-1");
        when(documentTwo.getData()).thenReturn(Map.of("full_name", "Buyer Two"));
        when(documentTwo.getId()).thenReturn("buyer-2");

        List<Map<String, Object>> result = service.getDocuments("buyers");

        assertThat(result).hasSize(2);
        assertThat(result.get(0)).containsEntry("id", "buyer-1");
        assertThat(result.get(0)).containsEntry("full_name", "Buyer One");
    }

    @Test
    void rejectUnsupportedCollectionNames() {
        FirestoreCollectionService service = new FirestoreCollectionService(firestore);

        assertThatThrownBy(() -> service.getDocuments("invalid_collection"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Unsupported collection");
    }
}