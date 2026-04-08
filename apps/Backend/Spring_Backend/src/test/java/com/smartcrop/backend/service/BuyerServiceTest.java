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
import com.smartcrop.backend.dto.BuyerRequest;

@ExtendWith(MockitoExtension.class)
class BuyerServiceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private com.google.cloud.firestore.CollectionReference buyersCollection;

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

    @Test
    void createBuyerGeneratesSequentialBuyerCode() throws Exception {
        BuyerService service = new BuyerService(firestore);
        BuyerRequest request = new BuyerRequest(
            "Buyer One",
            "0772222222",
            "buyer1@gmail.com",
            "Galle",
            "Southern",
            "wholesaler",
            "Green Mart",
            "Rice",
            100.0,
            "Need weekly supply"
        );

        when(firestore.collection("buyers")).thenReturn(buyersCollection);
        when(firestore.collection("counters")).thenReturn(countersCollection);
        when(countersCollection.document("buyer_code_2026")).thenReturn(counterDocumentRef);
        when(counterSnapshot.exists()).thenReturn(false);
        when(transaction.get(counterDocumentRef)).thenReturn(ApiFutures.immediateFuture(counterSnapshot));
        when(buyersCollection.add(anyMap())).thenReturn(ApiFutures.immediateFuture(savedDocumentRef));
        when(savedDocumentRef.getId()).thenReturn("buyer-doc-1");
        when(firestore.runTransaction(any())).thenAnswer(invocation -> {
            Transaction.Function<Long> function = invocation.getArgument(0);
            return ApiFutures.immediateFuture(function.updateCallback(transaction));
        });

        Map<String, String> result = service.createBuyer(request);

        assertThat(result).containsEntry("id", "buyer-doc-1");
        assertThat(result).containsEntry("buyerCode", "BUY-2026-0001");

        ArgumentCaptor<Map<String, Object>> buyerCaptor = ArgumentCaptor.forClass(Map.class);
        verify(buyersCollection).add(buyerCaptor.capture());
        assertThat(buyerCaptor.getValue())
            .containsEntry("full_name", "Buyer One")
            .containsEntry("buyer_code", "BUY-2026-0001");
    }

    @Test
    void getBuyersReturnsDocuments() throws Exception {
        BuyerService service = new BuyerService(firestore);

        when(firestore.collection("buyers")).thenReturn(buyersCollection);
        when(buyersCollection.get()).thenReturn(ApiFutures.immediateFuture(querySnapshot));
        when(querySnapshot.getDocuments()).thenReturn(List.of(documentOne));
        when(documentOne.getData()).thenReturn(Map.of("full_name", "Buyer One"));
        when(documentOne.getId()).thenReturn("buyer-1");

        List<Map<String, Object>> result = service.getBuyers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("id", "buyer-1");
    }
}