package com.taoji;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.flyway.enabled=false",
        "spring.jooq.sql-dialect=DEFAULT"
})
class TaojiApplicationTests {

    @Test
    void contextLoads() {
        // Smoke test: application context loads successfully
    }
}
