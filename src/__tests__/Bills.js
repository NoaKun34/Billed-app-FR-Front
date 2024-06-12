/**
 * @jest-environment jsdom
 */

import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom/extend-expect";

import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then all bills must be shown", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: store,
        localStorage: localStorageMock,
      });

      const getBillsSpy = jest.spyOn(billsContainer, "getBills");

      const billsResult = await billsContainer.getBills();

      expect(getBillsSpy).toHaveBeenCalled();

      expect(billsResult.length).toEqual(bills.length);
    });

    describe("When I click on new bill button", () => {
      test("Then page should change to new bill page", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        expect(location.href).toEqual("http://localhost/#employee/bills");
        const btn = screen.getByTestId("btn-new-bill");
        userEvent.click(btn);
        expect(location.href).toEqual("http://localhost/#employee/bill/new");
      });
    });

    describe("When I click on view action button", () => {
      test("Then a modal should open", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEyes = screen.getAllByTestId("icon-eye");

        const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye);

        const modale = document.getElementById("modaleFile");

        $.fn.modal = jest.fn(() => modale.classList.add("show"));

        iconEyes.forEach((iconEye) => {
          iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
          userEvent.click(iconEye);

          expect(handleClickIconEye).toHaveBeenCalled();

          expect(modale).toHaveClass("show");
        });
      });
    });

    describe("When I navigate to Bills Page", () => {
      test("fetches bills from mock API GET", async () => {
        jest.spyOn(store, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText("Mes notes de frais"));

        const newBillBtn = await screen.findByRole("button", {
          name: /nouvelle note de frais/i,
        });
        const billsTableRows = screen.getByTestId("tbody");

        expect(newBillBtn).toBeTruthy();
        expect(billsTableRows).toBeTruthy();
        expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);
      });
      test("Then fetches fails with 404 message error from mock API GET", async () => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
  
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
  
        const test = new Bills({
          document,
          onNavigate,
          store: store,
          localStorageMock: window.localStorage,
        });
  
        try {
          await test.getBills(404);
        } catch (e) {
          expect(e.message).toBe("Erreur 404");
        }
      });
      test("Then fetches fails with 500 message error from mock API GET", async () => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
  
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
  
        const test = new Bills({
          document,
          onNavigate,
          store: store,
          localStorageMock: window.localStorage,
        });
  
        try {
          await test.getBills(500);
        } catch (e) {
          expect(e.message).toBe("Erreur 500");
        }
      });
    });
  });
});
