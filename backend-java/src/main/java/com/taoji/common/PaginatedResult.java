package com.taoji.common;

import lombok.Getter;

import java.util.List;

@Getter
public class PaginatedResult<T> {

    private final List<T> items;
    private final long total;
    private final int page;
    private final int pageSize;
    private final int totalPages;

    public PaginatedResult(List<T> items, long total, int page, int pageSize) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = pageSize > 0 ? (int) Math.ceil((double) total / pageSize) : 0;
    }

    public static <T> PaginatedResult<T> of(List<T> items, long total, PageRequest pageRequest) {
        return new PaginatedResult<>(items, total, pageRequest.getPage(), pageRequest.getPageSize());
    }
}
