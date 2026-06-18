package com.taoji;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TaojiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaojiApplication.class, args);
    }
}
