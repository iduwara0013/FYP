package com.smartcrop.backend.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Value("${firebase.credentials.path:}")
    private String credentialsPath;

    @Value("${firebase.credentials.json:}")
    private String credentialsJson;

    @Bean
    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
    public Firestore firestore() throws IOException {
        if (FirebaseApp.getApps().isEmpty() && firebaseEnabled) {
            FirebaseOptions.Builder builder = FirebaseOptions.builder();

            if (credentialsJson != null && !credentialsJson.isBlank()) {
                builder.setCredentials(
                    GoogleCredentials.fromStream(
                        new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))
                    )
                );
            } else if (credentialsPath != null && !credentialsPath.isBlank()) {
                builder.setCredentials(
                    GoogleCredentials.fromStream(new ClassPathResource(credentialsPath).getInputStream())
                );
            }

            FirebaseApp.initializeApp(builder.build());
        }

        return FirestoreClient.getFirestore();
    }
}
