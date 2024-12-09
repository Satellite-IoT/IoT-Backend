import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

// interceptors/memory-leak.interceptor.ts
@Injectable()
export class MemoryLeakInterceptor implements NestInterceptor {
  private readonly MEMORY_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private readonly memoryUsageMap = new Map<string, number>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const route = context.getArgByIndex(0).route.path;
    const initialMemory = process.memoryUsage();

    return next.handle().pipe(
      tap(() => {
        const finalMemory = process.memoryUsage();

        // 詳細的記憶體使用分析
        const memoryDiff = {
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external,
          rss: finalMemory.rss - initialMemory.rss,
        };

        // 追蹤路由的記憶體使用趨勢
        const previousUsage = this.memoryUsageMap.get(route) || 0;
        this.memoryUsageMap.set(route, previousUsage + memoryDiff.heapUsed);

        if (memoryDiff.heapUsed > this.MEMORY_THRESHOLD) {
          console.warn(`
            Memory Leak Warning
            -------------------
            Route: ${route}
            Timestamp: ${new Date().toISOString()}
            
            Memory Changes:
            - Heap Used: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB
            - Heap Total: ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)}MB
            - External: ${(memoryDiff.external / 1024 / 1024).toFixed(2)}MB
            - RSS: ${(memoryDiff.rss / 1024 / 1024).toFixed(2)}MB
            
            Cumulative Memory Usage for Route: ${(this.memoryUsageMap.get(route) / 1024 / 1024).toFixed(2)}MB
            
            Current Memory State:
            - Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
            - Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)}MB
            - External: ${(finalMemory.external / 1024 / 1024).toFixed(2)}MB
            - RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)}MB
          `);
        }
      }),
    );
  }
}
