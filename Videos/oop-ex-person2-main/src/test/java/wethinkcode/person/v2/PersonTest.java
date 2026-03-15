package wethinkcode.person.v2;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PersonTest {

    @Test
    void constructorWithNameAndBirthDate() {
        LocalDate dob = LocalDate.of(1990, 1, 1);
        Person p = new Person("Alice", dob);
        assertEquals("Alice", p.name());
        assertEquals(dob, p.birthDate());
    }

    @Test
    void constructorWithNameOnly() {
        Person p = new Person("Bob");
        assertEquals("Bob", p.name());
        assertNull(p.birthDate());
    }

    @Test
    void constructorWithNullBirthDate() {
        Person p = new Person("Carol", null);
        assertEquals("Carol", p.name());
        assertNull(p.birthDate());
    }

    @Test
    void nullNameThrowsNullPointerException() {
        assertThrows(NullPointerException.class, () -> new Person(null));
    }

    @Test
    void nullNameWithDateThrowsNullPointerException() {
        assertThrows(NullPointerException.class, () -> new Person(null, LocalDate.of(1990, 1, 1)));
    }

    @Test
    void emptyNameThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> new Person(""));
    }

    @Test
    void futureBirthDateThrowsIllegalArgumentException() {
        LocalDate future = LocalDate.now().plusDays(1);
        assertThrows(IllegalArgumentException.class, () -> new Person("Dave", future));
    }

    @Test
    void todayBirthDateIsValid() {
        assertDoesNotThrow(() -> new Person("Eve", LocalDate.now()));
    }

    @Test
    void pastBirthDateIsValid() {
        assertDoesNotThrow(() -> new Person("Frank", LocalDate.of(2000, 6, 15)));
    }

    @Test
    void asFormattedStringWithBirthDate() {
        LocalDate dob = LocalDate.of(1990, 1, 1);
        Person p = new Person("Alice", dob);
        assertEquals("Person: Alice, born on 1990-01-01", p.asFormattedString());
    }

    @Test
    void asFormattedStringWithoutBirthDate() {
        Person p = new Person("Bob");
        assertEquals("Person: Bob, unknown birth date", p.asFormattedString());
    }
}
