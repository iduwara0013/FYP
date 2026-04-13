package com.smartcrop.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

@Service
public class HartiPriceService {

    private record BulletinSource(String label, String bulletinDate, String pdfUrl) {
    }

    private record BulletinResult(
        String label,
        String bulletinDate,
        String pdfUrl,
        boolean success,
        String message,
        String error,
        int lineCount,
        List<Map<String, Object>> entries
    ) {
    }

    private static final String SOURCE_URL = "https://www.harti.gov.lk/daily-price.php";
    private static final Pattern PRICE_PATTERN = Pattern.compile("(?<!\\d)(?:\\d{1,3}(?:,\\d{3})*|\\d+)(?:\\.\\d+)?");
    private static final LocalDate LATEST_BULLETIN_DATE = LocalDate.of(2026, 4, 9);
    private static final DateTimeFormatter BULLETIN_FOLDER_FORMAT = DateTimeFormatter.ofPattern("MMMM", Locale.ENGLISH);
    private static final DateTimeFormatter BULLETIN_FILE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public Map<String, Object> fetchLivePrices() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sourceUrl", SOURCE_URL);
        response.put("fetchedAt", Instant.now().toString());
        response.put("entries", List.of());
        response.put("bulletins", List.of());
        response.put("lineCount", 0);
        response.put("success", false);

        List<BulletinResult> bulletins = new ArrayList<>();
        BulletinResult firstSuccessfulBulletin = null;

        for (BulletinSource bulletinSource : buildBulletinSources()) {
            BulletinResult bulletinResult = readBulletin(bulletinSource);
            bulletins.add(bulletinResult);

            if (firstSuccessfulBulletin == null && bulletinResult.success()) {
                firstSuccessfulBulletin = bulletinResult;
            }
        }

        response.put("bulletins", bulletins.stream().map(this::toBulletinMap).toList());

        if (firstSuccessfulBulletin != null) {
            response.put("pageTitle", "HARTI Vegetable Price Bulletin");
            response.put("bulletinUrl", firstSuccessfulBulletin.pdfUrl());
            response.put("bulletinDate", firstSuccessfulBulletin.bulletinDate());
            response.put("bulletinLabel", firstSuccessfulBulletin.label());
            response.put("entries", firstSuccessfulBulletin.entries());
            response.put("lineCount", firstSuccessfulBulletin.lineCount());
            response.put("success", true);
            response.put("message", "Live HARTI PDF prices loaded successfully.");
        } else {
            response.put("pageTitle", "HARTI Vegetable Price Bulletin");
            response.put("message", "No readable HARTI bulletins were found in the last 10 days.");
            response.put("error", "BulletinUnavailable");
        }

        return response;
    }

    private List<BulletinSource> buildBulletinSources() {
        List<BulletinSource> sources = new ArrayList<>();

        for (int offset = 0; offset < 10; offset++) {
            LocalDate bulletinDate = LATEST_BULLETIN_DATE.minusDays(offset);
            String bulletinDateText = bulletinDate.toString();
            String year = String.valueOf(bulletinDate.getYear());
            String monthFolder = bulletinDate.format(BULLETIN_FOLDER_FORMAT);
            String fileDate = bulletinDate.format(BULLETIN_FILE_FORMAT);
            String pdfUrl = String.format(
                "https://www.harti.gov.lk/assets/pdf/food_price/daily/eng/%s/%s/Vegetable%%20Pricenew%%20ex1(%s).pdf",
                year,
                monthFolder,
                fileDate
            );

            sources.add(new BulletinSource(
                offset == 0 ? "Latest bulletin" : "Previous bulletin",
                bulletinDateText,
                pdfUrl
            ));
        }

        return sources;
    }

    private BulletinResult readBulletin(BulletinSource bulletinSource) {
        try {
            byte[] pdfBytes = Jsoup.connect(bulletinSource.pdfUrl())
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                .timeout(30000)
                .followRedirects(true)
                .ignoreContentType(true)
                .ignoreHttpErrors(true)
                .execute()
                .bodyAsBytes();

            List<Map<String, Object>> entries = extractStructuredRows(pdfBytes);
            if (!entries.isEmpty()) {
                return new BulletinResult(
                    bulletinSource.label(),
                    bulletinSource.bulletinDate(),
                    bulletinSource.pdfUrl(),
                    true,
                    "Live HARTI PDF prices loaded successfully.",
                    null,
                    entries.size(),
                    entries
                );
            }

            return new BulletinResult(
                bulletinSource.label(),
                bulletinSource.bulletinDate(),
                bulletinSource.pdfUrl(),
                false,
                "The bulletin PDF was readable, but no structured price rows were detected yet.",
                null,
                0,
                List.of()
            );
        } catch (Exception exception) {
            return new BulletinResult(
                bulletinSource.label(),
                bulletinSource.bulletinDate(),
                bulletinSource.pdfUrl(),
                false,
                "The bulletin PDF could not be read.",
                exception.getClass().getSimpleName(),
                0,
                List.of()
            );
        }
    }

    private List<Map<String, Object>> extractStructuredRows(byte[] pdfBytes) throws IOException {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            String text = stripper.getText(document);
            String[] rawLines = text.split("\\R");
            List<Map<String, Object>> entries = new ArrayList<>();

            for (String rawLine : rawLines) {
                String line = cleanText(rawLine).replaceAll("\\s{2,}", " ");
                if (line.isBlank() || isMetadataLine(line)) {
                    continue;
                }

                List<String> prices = extractPrices(line);
                if (prices.isEmpty()) {
                    continue;
                }

                String cropName = extractCropName(line, prices);
                if (cropName.isBlank()) {
                    continue;
                }

                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("rowNumber", entries.size() + 1);
                entry.put("cropName", cropName);
                entry.put("prices", prices);
                entry.put("displayPrice", String.join(" / ", prices));
                entry.put("rawText", line);
                entries.add(entry);
            }

            return entries;
        }
    }

    private boolean isMetadataLine(String line) {
        String lower = line.toLowerCase();
        return lower.contains("daily food commodities bulletin")
            || lower.contains("vegetable price")
            || lower.contains("page ")
            || lower.contains("harti")
            || lower.contains("copyright")
            || lower.contains("sinhala")
            || lower.startsWith("date")
            || lower.startsWith("english")
            || lower.startsWith("medium")
            || lower.startsWith("download");
    }

    private List<String> extractPrices(String line) {
        List<String> prices = new ArrayList<>();
        Matcher matcher = PRICE_PATTERN.matcher(line);

        while (matcher.find()) {
            prices.add(matcher.group());
        }

        return prices;
    }

    private String extractCropName(String line, List<String> prices) {
        if (prices.isEmpty()) {
            return "";
        }

        int firstPriceIndex = line.indexOf(prices.get(0));
        if (firstPriceIndex <= 0) {
            return "";
        }

        String cropName = line.substring(0, firstPriceIndex)
            .replaceAll("[\u00a0]+", " ")
            .replaceAll("[|]+", " ")
            .replaceAll("[-–—]+$", "")
            .replaceAll("[\u0D80-\u0DFF].*$", "")
            .replaceAll("\\s{2,}", " ")
            .trim();

        if (cropName.length() < 2) {
            return "";
        }

        return cropName;
    }

    private Map<String, Object> toBulletinMap(BulletinResult bulletinResult) {
        Map<String, Object> bulletin = new LinkedHashMap<>();
        bulletin.put("label", bulletinResult.label());
        bulletin.put("date", bulletinResult.bulletinDate());
        bulletin.put("url", bulletinResult.pdfUrl());
        bulletin.put("success", bulletinResult.success());
        bulletin.put("message", bulletinResult.message());
        bulletin.put("error", bulletinResult.error());
        bulletin.put("lineCount", bulletinResult.lineCount());
        bulletin.put("entries", bulletinResult.entries());
        return bulletin;
    }

    private String cleanText(String value) {
        return value == null ? "" : value.replace('\u00a0', ' ').trim();
    }
}