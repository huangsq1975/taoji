package com.taoji.config;

import org.jooq.Converter;
import org.jooq.ConverterProvider;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.conf.Settings;
import org.jooq.impl.DSL;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultConverterProvider;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.jooq.tools.LoggerListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Configuration
public class JooqConfig {

    @Autowired
    private DataSource dataSource;

    @Bean
    public DSLContext dslContext() {
        DefaultConfiguration config = new DefaultConfiguration();
        config.setDataSource(dataSource);
        config.setSQLDialect(SQLDialect.POSTGRES);
        config.setSettings(new Settings()
                .withRenderFormatted(true)
                .withExecuteLogging(true)
        );
        config.setExecuteListenerProvider(
                new DefaultExecuteListenerProvider(new LoggerListener())
        );
        // Auto-convert java.sql.Timestamp → java.time.LocalDateTime for all records
        config.setConverterProvider(new ConverterProvider() {
            private final ConverterProvider delegate = new DefaultConverterProvider();

            @Override
            @SuppressWarnings("unchecked")
            public <T, U> Converter<T, U> provide(Class<T> tType, Class<U> uType) {
                if (tType == Timestamp.class && uType == LocalDateTime.class) {
                    return (Converter<T, U>) Converter.ofNullable(
                            Timestamp.class,
                            LocalDateTime.class,
                            Timestamp::toLocalDateTime,
                            LocalDateTime::toString
                    );
                }
                return delegate.provide(tType, uType);
            }
        });
        return DSL.using(config);
    }
}
