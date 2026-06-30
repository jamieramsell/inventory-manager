package dev.jamieramsell.inventory;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Trivial liveness endpoint, used to confirm the service is up. */
@RestController
public class PingController {

  /**
   * Returns a simple liveness response.
   *
   * @return the string {@code "pong"}
   */
  @GetMapping("/ping")
  public String ping() {
    return "pong";
  }
}
