package com.smartcrop.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.Transaction;
import com.smartcrop.backend.dto.FarmerRequest;

@ExtendWith(MockitoExtension.class)
class FarmerServiceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private com.google.cloud.firestore.CollectionReference farmersCollection;

    @Mock
    private com.google.cloud.firestore.CollectionReference countersCollection;

    @Mock
    private DocumentReference savedDocumentRef;

    @Mock
    private DocumentReference counterDocumentRef;

    @Mock
    private DocumentSnapshot counterSnapshot;

    @Mock
    private Transaction transaction;

    @Mock
    private QuerySnapshot querySnapshot;

    @Mock
    private QueryDocumentSnapshot documentOne;

    @Mock
    private QueryDocumentSnapshot documentTwo;

    @Test
    void createFarmerGeneratesSequentialFarmerCode() throws Exception {
        FarmerService service = new FarmerService(firestore);
        FarmerRequest request = new FarmerRequest(
            "Kamal Perera",
            "0771234567",
            "kamal@gmail.com",
            "Matale",
            "Matale",
            "987654321V",
            "individual",
            5.5,
            10
        );

        when(firestore.collection("farmers")).thenReturn(farmersCollection);
        when(firestore.collection("counters")).thenReturn(countersCollection);
        when(countersCollection.document("farmer_code_2026")).thenReturn(counterDocumentRef);
        when(counterSnapshot.exists()).thenReturn(true);
        when(counterSnapshot.contains("sequence")).thenReturn(true);
        when(counterSnapshot.getLong("sequence")).thenReturn(3L);
        when(transaction.get(counterDocumentRef)).thenReturn(ApiFutures.immediateFuture(counterSnapshot));
        when(farmersCollection.add(anyMap())).thenReturn(ApiFutures.immediateFuture(savedDocumentRef));
        when(savedDocumentRef.getId()).thenReturn("doc-123");
        when(firestore.runTransaction(any())).thenAnswer(invocation -> {
            Transaction.Function<Long> function = invocation.getArgument(0);
            return ApiFutures.immediateFuture(function.updateCallback(transaction));
        });

        Map<String, String> result = service.createFarmer(request);

        assertThat(result).containsEntry("id", "doc-123");
        assertThat(result).containsEntry("farmerCode", "FARM-2026-0004");

        ArgumentCaptor<Map<String, Object>> farmerCaptor = ArgumentCaptor.forClass(Map.class);
        verify(farmersCollection).add(farmerCaptor.capture());
        assertThat(farmerCaptor.getValue())
            .containsEntry("full_name", "Kamal Perera")
            .containsEntry("farmer_code", "FARM-2026-0004")
            .containsEntry("region", "Matale");
    }

    @Test
    void getFarmersReturnsSavedDocumentsWithIds() throws Exception {
        FarmerService service = new FarmerService(firestore);

        when(firestore.collection("farmers")).thenReturn(farmersCollection);
        when(farmersCollection.get()).thenReturn(ApiFutures.immediateFuture(querySnapshot));
        when(querySnapshot.getDocuments()).thenReturn(List.of(documentOne, documentTwo));
        when(documentOne.getData()).thenReturn(Map.of("full_name", "Kamal Perera"));
        when(documentOne.getId()).thenReturn("doc-1");
        when(documentTwo.getData()).thenReturn(Map.of("full_name", "Nimal Silva"));
        when(documentTwo.getId()).thenReturn("doc-2");

        List<Map<String, Object>> result = service.getFarmers();

        assertThat(result).hasSize(2);
        assertThat(result.get(0)).containsEntry("id", "doc-1");
        assertThat(result.get(0)).containsEntry("full_name", "Kamal Perera");
        assertThat(result.get(1)).containsEntry("id", "doc-2");
    }
}